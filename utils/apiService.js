import { Connection, PublicKey } from '@solana/web3.js';
import securityUtils from './security';
import programClient from './programClient';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Cache for storing fetched data
const cache = {
  employees: new Map(),
  workSessions: new Map(),
  payrollBatches: new Map(),
  lastFetch: {
    employees: null,
    workSessions: null,
    payrollBatches: null
  }
};

/**
 * Initialize connection to Solana
 * @param {string} endpoint - Solana RPC endpoint
 * @returns {Connection} - Solana connection
 */
export const initConnection = (endpoint) => {
  return new Connection(endpoint, 'confirmed');
};

/**
 * Initialize the program client
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @returns {Object} - Program client
 */
export const initProgram = (connection, wallet) => {
  try {
    return programClient.initializeProgram(connection, wallet);
  } catch (error) {
    console.error('Error initializing program:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'initProgram',
      error: error.message
    });
    throw error;
  }
};

/**
 * Initialize the employer account
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @returns {Promise<string>} - Transaction signature
 */
export const initializeEmployer = async (connection, wallet) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Initialize employer
    const tx = await programClient.initializeEmployer(program);
    
    return {
      success: true,
      signature: tx
    };
  } catch (error) {
    console.error('Error initializing employer:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'initializeEmployer',
      error: error.message
    });
    throw error;
  }
};

/**
 * Fetch employees from the Solana program
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {boolean} bypassCache - Whether to bypass cache
 * @returns {Promise<Array>} - Array of employees
 */
export const fetchEmployees = async (connection, wallet, bypassCache = false) => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      !bypassCache &&
      cache.lastFetch.employees &&
      now - cache.lastFetch.employees < CACHE_TTL &&
      cache.employees.size > 0
    ) {
      return Array.from(cache.employees.values());
    }
    
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Fetch employees from the program
    const employees = await programClient.fetchAllEmployees(program);
    
    // Format employees for the frontend
    const formattedEmployees = employees.map((employee, index) => ({
      id: index + 1,
      name: employee.name,
      position: employee.position,
      hourlyRate: employee.hourlyRate,
      walletAddress: employee.employeeWallet,
      isActive: employee.isActive,
      totalHoursWorked: employee.totalHoursWorked,
      totalPaid: employee.totalPaid,
      publicKey: employee.publicKey
    }));
    
    // Update cache
    cache.employees.clear();
    formattedEmployees.forEach(employee => {
      cache.employees.set(employee.id, employee);
    });
    cache.lastFetch.employees = now;
    
    return formattedEmployees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'fetchEmployees',
      error: error.message
    });
    
    // If there's an error, try to return cached data if available
    if (cache.employees.size > 0) {
      return Array.from(cache.employees.values());
    }
    
    throw error;
  }
};

/**
 * Fetch work sessions from the Solana program
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} filters - Optional filters
 * @param {boolean} bypassCache - Whether to bypass cache
 * @returns {Promise<Array>} - Array of work sessions
 */
export const fetchWorkSessions = async (connection, wallet, filters = {}, bypassCache = false) => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      !bypassCache &&
      cache.lastFetch.workSessions &&
      now - cache.lastFetch.workSessions < CACHE_TTL &&
      cache.workSessions.size > 0
    ) {
      let sessions = Array.from(cache.workSessions.values());
      
      // Apply filters
      if (filters.employeeId) {
        sessions = sessions.filter(session => session.employeeId === filters.employeeId);
      }
      if (filters.isPaid !== undefined) {
        sessions = sessions.filter(session => session.isPaid === filters.isPaid);
      }
      
      return sessions;
    }
    
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Fetch work sessions from the program
    const workSessions = await programClient.fetchAllWorkSessions(program);
    
    // Fetch employees to get names and hourly rates
    const employees = await fetchEmployees(connection, wallet);
    const employeeMap = new Map();
    employees.forEach(employee => {
      employeeMap.set(employee.walletAddress, employee);
    });
    
    // Format work sessions for the frontend
    const formattedSessions = workSessions.map((session, index) => {
      // Find the employee for this session
      const employee = Array.from(employeeMap.values()).find(
        emp => emp.publicKey === session.employee
      );
      
      // Calculate amount due
      const hourlyRate = employee ? employee.hourlyRate : 0;
      const duration = session.duration;
      const amountDue = (hourlyRate * duration) / 3600; // hourly rate * hours worked in hours
      
      return {
        id: index + 1,
        employeeId: employee ? employee.id : 0,
        employeeName: employee ? employee.name : 'Unknown',
        employeeWallet: session.employee,
        checkInTime: session.checkInTime * 1000, // Convert to milliseconds
        checkOutTime: session.checkOutTime * 1000, // Convert to milliseconds
        duration: session.duration,
        hourlyRate: hourlyRate,
        amountDue: amountDue,
        isPaid: session.isPaid,
        sessionId: session.sessionId,
        publicKey: session.publicKey
      };
    });
    
    // Update cache
    cache.workSessions.clear();
    formattedSessions.forEach(session => {
      cache.workSessions.set(session.id, session);
    });
    cache.lastFetch.workSessions = now;
    
    // Apply filters
    let filteredSessions = formattedSessions;
    if (filters.employeeId) {
      filteredSessions = filteredSessions.filter(session => session.employeeId === filters.employeeId);
    }
    if (filters.isPaid !== undefined) {
      filteredSessions = filteredSessions.filter(session => session.isPaid === filters.isPaid);
    }
    
    return filteredSessions;
  } catch (error) {
    console.error('Error fetching work sessions:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'fetchWorkSessions',
      error: error.message
    });
    
    // If there's an error, try to return cached data if available
    if (cache.workSessions.size > 0) {
      let sessions = Array.from(cache.workSessions.values());
      
      // Apply filters
      if (filters.employeeId) {
        sessions = sessions.filter(session => session.employeeId === filters.employeeId);
      }
      if (filters.isPaid !== undefined) {
        sessions = sessions.filter(session => session.isPaid === filters.isPaid);
      }
      
      return sessions;
    }
    
    throw error;
  }
};

/**
 * Fetch payroll batches from the Solana program
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {boolean} bypassCache - Whether to bypass cache
 * @returns {Promise<Array>} - Array of payroll batches
 */
export const fetchPayrollBatches = async (connection, wallet, bypassCache = false) => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      !bypassCache &&
      cache.lastFetch.payrollBatches &&
      now - cache.lastFetch.payrollBatches < CACHE_TTL &&
      cache.payrollBatches.size > 0
    ) {
      return Array.from(cache.payrollBatches.values());
    }
    
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Fetch payroll batches from the program
    const payrollBatches = await programClient.fetchAllPayrollBatches(program);
    
    // Format payroll batches for the frontend
    const formattedBatches = payrollBatches.map(batch => ({
      id: `BATCH-${batch.batchId.toString().padStart(3, '0')}`,
      batchId: batch.batchId,
      createdAt: batch.createdAt * 1000, // Convert to milliseconds
      processedAt: batch.processedAt ? batch.processedAt * 1000 : null, // Convert to milliseconds
      totalAmount: batch.totalAmount,
      sessionCount: 0, // This will be calculated when processing
      isProcessed: batch.isProcessed,
      publicKey: batch.publicKey
    }));
    
    // Update cache
    cache.payrollBatches.clear();
    formattedBatches.forEach(batch => {
      cache.payrollBatches.set(batch.id, batch);
    });
    cache.lastFetch.payrollBatches = now;
    
    return formattedBatches;
  } catch (error) {
    console.error('Error fetching payroll batches:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'fetchPayrollBatches',
      error: error.message
    });
    
    // If there's an error, try to return cached data if available
    if (cache.payrollBatches.size > 0) {
      return Array.from(cache.payrollBatches.values());
    }
    
    throw error;
  }
};

/**
 * Register a new employee
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>} - New employee
 */
export const registerEmployee = async (connection, wallet, employeeData) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      name: securityUtils.sanitizeInput(employeeData.name),
      position: securityUtils.sanitizeInput(employeeData.position),
      hourlyRate: parseFloat(employeeData.hourlyRate),
      walletAddress: employeeData.walletAddress
    };
    
    // Validate wallet address
    if (!securityUtils.isValidPublicKey(sanitizedData.walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Register employee
    const tx = await programClient.registerEmployee(program, sanitizedData);
    
    // Fetch the newly created employee
    const employeeWallet = new PublicKey(sanitizedData.walletAddress);
    const [employeeAccount] = programClient.findEmployeeAccount(program, employeeWallet);
    const employeeData = await programClient.fetchEmployee(program, employeeWallet);
    
    // Format for frontend
    const newEmployee = {
      id: cache.employees.size + 1,
      name: sanitizedData.name,
      position: sanitizedData.position,
      hourlyRate: sanitizedData.hourlyRate,
      walletAddress: sanitizedData.walletAddress,
      isActive: true,
      totalHoursWorked: 0,
      totalPaid: 0,
      publicKey: employeeAccount.toString()
    };
    
    // Update cache
    cache.employees.set(newEmployee.id, newEmployee);
    
    return {
      employee: newEmployee,
      signature: tx
    };
  } catch (error) {
    console.error('Error registering employee:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'registerEmployee',
      error: error.message
    });
    throw error;
  }
};

/**
 * Update an employee
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>} - Updated employee
 */
export const updateEmployee = async (connection, wallet, employeeData) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      name: securityUtils.sanitizeInput(employeeData.name),
      position: securityUtils.sanitizeInput(employeeData.position),
      hourlyRate: parseFloat(employeeData.hourlyRate),
      walletAddress: employeeData.walletAddress,
      isActive: employeeData.isActive
    };
    
    // Validate wallet address
    if (!securityUtils.isValidPublicKey(sanitizedData.walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Update employee
    const tx = await programClient.updateEmployee(program, sanitizedData);
    
    // Fetch the updated employee
    const employeeWallet = new PublicKey(sanitizedData.walletAddress);
    const employeeData = await programClient.fetchEmployee(program, employeeWallet);
    
    // Find the employee in the cache
    const employeeId = Array.from(cache.employees.entries())
      .find(([id, emp]) => emp.walletAddress === sanitizedData.walletAddress)?.[0];
    
    if (!employeeId) {
      throw new Error('Employee not found in cache');
    }
    
    // Format for frontend
    const updatedEmployee = {
      id: employeeId,
      name: sanitizedData.name,
      position: sanitizedData.position,
      hourlyRate: sanitizedData.hourlyRate,
      walletAddress: sanitizedData.walletAddress,
      isActive: sanitizedData.isActive,
      totalHoursWorked: employeeData.totalHoursWorked,
      totalPaid: employeeData.totalPaid
    };
    
    // Update cache
    cache.employees.set(employeeId, updatedEmployee);
    
    return {
      employee: updatedEmployee,
      signature: tx
    };
  } catch (error) {
    console.error('Error updating employee:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'updateEmployee',
      error: error.message
    });
    throw error;
  }
};

/**
 * Record employee check-in
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} checkInData - Check-in data
 * @returns {Promise<Object>} - New work session
 */
export const recordCheckIn = async (connection, wallet, checkInData) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Validate employee ID
    if (!cache.employees.has(checkInData.employeeId)) {
      throw new Error('Employee not found');
    }
    
    // Get employee
    const employee = cache.employees.get(checkInData.employeeId);
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Generate session ID (timestamp-based for uniqueness)
    const sessionId = Math.floor(Date.now() / 1000);
    
    // Record check-in
    const tx = await programClient.checkIn(program, {
      employeeWallet: employee.walletAddress,
      sessionId: sessionId,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    // Find the work session account
    const employeeWallet = new PublicKey(employee.walletAddress);
    const [workSessionAccount] = programClient.findWorkSessionAccount(
      program,
      employeeWallet,
      sessionId
    );
    
    // Create new work session for frontend
    const newSession = {
      id: cache.workSessions.size + 1,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeWallet: employee.walletAddress,
      checkInTime: Date.now(),
      checkOutTime: null,
      duration: 0,
      hourlyRate: employee.hourlyRate,
      amountDue: 0,
      isPaid: false,
      sessionId: sessionId,
      publicKey: workSessionAccount.toString()
    };
    
    // Update cache
    cache.workSessions.set(newSession.id, newSession);
    
    return {
      session: newSession,
      signature: tx
    };
  } catch (error) {
    console.error('Error recording check-in:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'recordCheckIn',
      error: error.message
    });
    throw error;
  }
};

/**
 * Record employee check-out
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} checkOutData - Check-out data
 * @returns {Promise<Object>} - Updated work session
 */
export const recordCheckOut = async (connection, wallet, checkOutData) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Validate session ID
    if (!cache.workSessions.has(checkOutData.sessionId)) {
      throw new Error('Work session not found');
    }
    
    // Get work session
    const session = cache.workSessions.get(checkOutData.sessionId);
    
    // Verify session is not already checked out
    if (session.checkOutTime) {
      throw new Error('Session already checked out');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Record check-out
    const tx = await programClient.checkOut(program, {
      employeeWallet: session.employeeWallet,
      sessionId: session.sessionId,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    // Fetch the updated work session
    const employeeWallet = new PublicKey(session.employeeWallet);
    const workSessionData = await programClient.fetchWorkSession(
      program,
      employeeWallet,
      session.sessionId
    );
    
    // Update session
    const checkOutTime = Date.now();
    const duration = workSessionData.duration;
    const amountDue = (session.hourlyRate * duration) / 3600; // hourly rate * hours worked
    
    const updatedSession = {
      ...session,
      checkOutTime,
      duration,
      amountDue
    };
    
    // Update cache
    cache.workSessions.set(session.id, updatedSession);
    
    // Update employee total hours worked
    if (cache.employees.has(session.employeeId)) {
      const employee = cache.employees.get(session.employeeId);
      employee.totalHoursWorked += duration;
      cache.employees.set(employee.id, employee);
    }
    
    return {
      session: updatedSession,
      signature: tx
    };
  } catch (error) {
    console.error('Error recording check-out:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'recordCheckOut',
      error: error.message
    });
    throw error;
  }
};

/**
 * Create a new payroll batch
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Array} sessionIds - Array of session IDs to include in batch
 * @returns {Promise<Object>} - New payroll batch
 */
export const createPayrollBatch = async (connection, wallet, sessionIds) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Validate session IDs
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new Error('Invalid session IDs');
    }
    
    // Verify all sessions exist and are not already paid
    const sessions = [];
    for (const sessionId of sessionIds) {
      if (!cache.workSessions.has(sessionId)) {
        throw new Error(`Work session ${sessionId} not found`);
      }
      
      const session = cache.workSessions.get(sessionId);
      if (session.isPaid) {
        throw new Error(`Work session ${sessionId} is already paid`);
      }
      
      sessions.push(session);
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Generate batch ID (timestamp-based for uniqueness)
    const batchId = Math.floor(Date.now() / 1000);
    
    // Create payroll batch
    const tx = await programClient.createPayrollBatch(program, {
      batchId: batchId,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    // Find the payroll batch account
    const [payrollBatchAccount] = programClient.findPayrollBatchAccount(program, batchId);
    
    // Calculate total amount
    const totalAmount = sessions.reduce((total, session) => total + session.amountDue, 0);
    
    // Create new batch for frontend
    const newBatch = {
      id: `BATCH-${batchId.toString().padStart(3, '0')}`,
      batchId: batchId,
      createdAt: Date.now(),
      processedAt: null,
      totalAmount,
      sessionCount: sessions.length,
      isProcessed: false,
      publicKey: payrollBatchAccount.toString()
    };
    
    // Update cache
    cache.payrollBatches.set(newBatch.id, newBatch);
    
    return {
      batch: newBatch,
      signature: tx
    };
  } catch (error) {
    console.error('Error creating payroll batch:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'createPayrollBatch',
      error: error.message
    });
    throw error;
  }
};

/**
 * Process a payroll batch
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {string} batchId - Batch ID
 * @param {Array} sessionIds - Array of session IDs to process
 * @returns {Promise<Object>} - Processed batch
 */
export const processPayrollBatch = async (connection, wallet, batchId, sessionIds) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Validate batch ID
    if (!cache.payrollBatches.has(batchId)) {
      throw new Error('Payroll batch not found');
    }
    
    // Get batch
    const batch = cache.payrollBatches.get(batchId);
    
    // Verify batch is not already processed
    if (batch.isProcessed) {
      throw new Error('Batch already processed');
    }
    
    // Validate session IDs
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new Error('Invalid session IDs');
    }
    
    // Get sessions
    const sessions = [];
    for (const sessionId of sessionIds) {
      if (!cache.workSessions.has(sessionId)) {
        throw new Error(`Work session ${sessionId} not found`);
      }
      
      const session = cache.workSessions.get(sessionId);
      sessions.push(session);
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Collect employee and work session accounts
    const employeeAccounts = [];
    const workSessionAccounts = [];
    
    for (const session of sessions) {
      // Add work session account
      workSessionAccounts.push(session.publicKey);
      
      // Find employee account
      const employee = cache.employees.get(session.employeeId);
      if (employee && !employeeAccounts.includes(employee.publicKey)) {
        employeeAccounts.push(employee.publicKey);
      }
    }
    
    // Process payroll
    const tx = await programClient.processPayroll(
      program,
      {
        batchId: batch.batchId,
        timestamp: Math.floor(Date.now() / 1000)
      },
      employeeAccounts,
      workSessionAccounts
    );
    
    // Mark sessions as paid
    for (const session of sessions) {
      session.isPaid = true;
      cache.workSessions.set(session.id, session);
      
      // Update employee total paid
      if (cache.employees.has(session.employeeId)) {
        const employee = cache.employees.get(session.employeeId);
        employee.totalPaid += session.amountDue;
        cache.employees.set(employee.id, employee);
      }
    }
    
    // Update batch
    const updatedBatch = {
      ...batch,
      processedAt: Date.now(),
      isProcessed: true
    };
    
    // Update cache
    cache.payrollBatches.set(batchId, updatedBatch);
    
    return {
      batch: updatedBatch,
      signature: tx
    };
  } catch (error) {
    console.error('Error processing payroll batch:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'processPayrollBatch',
      error: error.message
    });
    throw error;
  }
};

/**
 * Mark a work session as paid
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} - Updated work session
 */
export const markSessionPaid = async (connection, wallet, sessionData) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Validate session ID
    if (!cache.workSessions.has(sessionData.sessionId)) {
      throw new Error('Work session not found');
    }
    
    // Get work session
    const session = cache.workSessions.get(sessionData.sessionId);
    
    // Verify session is not already paid
    if (session.isPaid) {
      throw new Error('Session already paid');
    }
    
    // Initialize program
    const program = programClient.initializeProgram(connection, wallet);
    
    // Mark session as paid
    const tx = await programClient.markSessionPaid(program, {
      employeeWallet: session.employeeWallet,
      sessionId: session.sessionId
    });
    
    // Update session
    const updatedSession = {
      ...session,
      isPaid: true
    };
    
    // Update cache
    cache.workSessions.set(session.id, updatedSession);
    
    // Update employee total paid
    if (cache.employees.has(session.employeeId)) {
      const employee = cache.employees.get(session.employeeId);
      employee.totalPaid += session.amountDue;
      cache.employees.set(employee.id, employee);
    }
    
    return {
      session: updatedSession,
      signature: tx
    };
  } catch (error) {
    console.error('Error marking session as paid:', error);
    securityUtils.logSecurityEvent('API_ERROR', {
      operation: 'markSessionPaid',
      error: error.message
    });
    throw error;
  }
};

export default {
  initConnection,
  initProgram,
  initializeEmployer,
  fetchEmployees,
  fetchWorkSessions,
  fetchPayrollBatches,
  registerEmployee,
  updateEmployee,
  recordCheckIn,
  recordCheckOut,
  createPayrollBatch,
  processPayrollBatch,
  markSessionPaid
};