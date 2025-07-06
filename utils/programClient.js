import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@project-serum/anchor';
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
import { Buffer } from 'buffer';
import securityUtils from './security';

// Import the IDL (Interface Definition Language) for your program
// In a real app, you would import this from a file or fetch it from the chain
import { IDL } from '../employee_payroll_program/app/program_client/index';

// Program ID - Replace with your actual program ID
const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

/**
 * Initialize the program client
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @returns {Program} - Anchor program client
 */
export const initializeProgram = (connection, wallet) => {
  try {
    // Create an Anchor provider
    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
    
    // Create the program instance
    const program = new Program(IDL, PROGRAM_ID, provider);
    
    return program;
  } catch (error) {
    console.error('Error initializing program:', error);
    securityUtils.logSecurityEvent('PROGRAM_INIT_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Find the employer account PDA
 * @param {Program} program - Anchor program client
 * @param {PublicKey} authority - Employer authority
 * @returns {[PublicKey, number]} - PDA and bump
 */
export const findEmployerAccount = (program, authority) => {
  try {
    return findProgramAddressSync(
      [Buffer.from('employer')],
      program.programId
    );
  } catch (error) {
    console.error('Error finding employer account:', error);
    throw error;
  }
};

/**
 * Find an employee account PDA
 * @param {Program} program - Anchor program client
 * @param {PublicKey} employeeWallet - Employee wallet address
 * @returns {[PublicKey, number]} - PDA and bump
 */
export const findEmployeeAccount = (program, employeeWallet) => {
  try {
    return findProgramAddressSync(
      [
        Buffer.from('employee'),
        employeeWallet.toBuffer()
      ],
      program.programId
    );
  } catch (error) {
    console.error('Error finding employee account:', error);
    throw error;
  }
};

/**
 * Find a work session account PDA
 * @param {Program} program - Anchor program client
 * @param {PublicKey} employeeWallet - Employee wallet address
 * @param {number} sessionId - Session ID
 * @returns {[PublicKey, number]} - PDA and bump
 */
export const findWorkSessionAccount = (program, employeeWallet, sessionId) => {
  try {
    return findProgramAddressSync(
      [
        Buffer.from('work_session'),
        employeeWallet.toBuffer(),
        new BN(sessionId).toArrayLike(Buffer, 'le', 8)
      ],
      program.programId
    );
  } catch (error) {
    console.error('Error finding work session account:', error);
    throw error;
  }
};

/**
 * Find a payroll batch account PDA
 * @param {Program} program - Anchor program client
 * @param {number} batchId - Batch ID
 * @returns {[PublicKey, number]} - PDA and bump
 */
export const findPayrollBatchAccount = (program, batchId) => {
  try {
    return findProgramAddressSync(
      [
        Buffer.from('payroll_batch'),
        new BN(batchId).toArrayLike(Buffer, 'le', 8)
      ],
      program.programId
    );
  } catch (error) {
    console.error('Error finding payroll batch account:', error);
    throw error;
  }
};

/**
 * Initialize the employer account
 * @param {Program} program - Anchor program client
 * @returns {Promise<string>} - Transaction signature
 */
export const initializeEmployer = async (program) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Find the employer account PDA
    const [employerAccount] = findEmployerAccount(program, program.provider.wallet.publicKey);
    
    // Build and send the transaction
    const tx = await program.methods
      .initializeEmployer()
      .accounts({
        employer: employerAccount,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('EMPLOYER_INITIALIZED', {
      employer: employerAccount.toString(),
      authority: program.provider.wallet.publicKey.toString(),
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error initializing employer:', error);
    securityUtils.logSecurityEvent('EMPLOYER_INIT_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Register a new employee
 * @param {Program} program - Anchor program client
 * @param {Object} employeeData - Employee data
 * @returns {Promise<string>} - Transaction signature
 */
export const registerEmployee = async (program, employeeData) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate employee data
    if (!employeeData.name || !employeeData.position || !employeeData.hourlyRate || !employeeData.employeeWallet) {
      throw new Error('Invalid employee data');
    }
    
    // Sanitize inputs
    const sanitizedName = securityUtils.sanitizeInput(employeeData.name);
    const sanitizedPosition = securityUtils.sanitizeInput(employeeData.position);
    
    // Validate wallet address
    const employeeWallet = new PublicKey(employeeData.employeeWallet);
    
    // Find the employer account PDA
    const [employerAccount] = findEmployerAccount(program, program.provider.wallet.publicKey);
    
    // Find the employee account PDA
    const [employeeAccount] = findEmployeeAccount(program, employeeWallet);
    
    // Build and send the transaction
    const tx = await program.methods
      .registerEmployee(
        sanitizedName,
        sanitizedPosition,
        new BN(employeeData.hourlyRate * 100) // Convert to cents for precision
      )
      .accounts({
        employee: employeeAccount,
        employer: employerAccount,
        employeeWallet: employeeWallet,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('EMPLOYEE_REGISTERED', {
      employee: employeeAccount.toString(),
      employeeWallet: employeeWallet.toString(),
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error registering employee:', error);
    securityUtils.logSecurityEvent('EMPLOYEE_REGISTER_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Update an employee's information
 * @param {Program} program - Anchor program client
 * @param {Object} employeeData - Employee data
 * @returns {Promise<string>} - Transaction signature
 */
export const updateEmployee = async (program, employeeData) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate employee data
    if (!employeeData.name || !employeeData.position || !employeeData.hourlyRate || !employeeData.employeeWallet) {
      throw new Error('Invalid employee data');
    }
    
    // Sanitize inputs
    const sanitizedName = securityUtils.sanitizeInput(employeeData.name);
    const sanitizedPosition = securityUtils.sanitizeInput(employeeData.position);
    
    // Validate wallet address
    const employeeWallet = new PublicKey(employeeData.employeeWallet);
    
    // Find the employee account PDA
    const [employeeAccount] = findEmployeeAccount(program, employeeWallet);
    
    // Build and send the transaction
    const tx = await program.methods
      .updateEmployee(
        sanitizedName,
        sanitizedPosition,
        new BN(employeeData.hourlyRate * 100), // Convert to cents for precision
        employeeData.isActive
      )
      .accounts({
        employee: employeeAccount,
        employeeWallet: employeeWallet,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('EMPLOYEE_UPDATED', {
      employee: employeeAccount.toString(),
      employeeWallet: employeeWallet.toString(),
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error updating employee:', error);
    securityUtils.logSecurityEvent('EMPLOYEE_UPDATE_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Record an employee check-in
 * @param {Program} program - Anchor program client
 * @param {Object} checkInData - Check-in data
 * @returns {Promise<string>} - Transaction signature
 */
export const checkIn = async (program, checkInData) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate check-in data
    if (!checkInData.employeeWallet || !checkInData.sessionId) {
      throw new Error('Invalid check-in data');
    }
    
    // Validate wallet address
    const employeeWallet = new PublicKey(checkInData.employeeWallet);
    
    // Find the employee account PDA
    const [employeeAccount] = findEmployeeAccount(program, employeeWallet);
    
    // Find the work session account PDA
    const [workSessionAccount] = findWorkSessionAccount(
      program,
      employeeWallet,
      checkInData.sessionId
    );
    
    // Get current timestamp
    const timestamp = checkInData.timestamp || Math.floor(Date.now() / 1000);
    
    // Build and send the transaction
    const tx = await program.methods
      .checkIn(
        new BN(checkInData.sessionId),
        new BN(timestamp)
      )
      .accounts({
        employee: employeeAccount,
        workSession: workSessionAccount,
        employeeWallet: employeeWallet,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('EMPLOYEE_CHECK_IN', {
      employee: employeeAccount.toString(),
      workSession: workSessionAccount.toString(),
      sessionId: checkInData.sessionId,
      timestamp,
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error checking in employee:', error);
    securityUtils.logSecurityEvent('CHECK_IN_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Record an employee check-out
 * @param {Program} program - Anchor program client
 * @param {Object} checkOutData - Check-out data
 * @returns {Promise<string>} - Transaction signature
 */
export const checkOut = async (program, checkOutData) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate check-out data
    if (!checkOutData.employeeWallet || !checkOutData.sessionId) {
      throw new Error('Invalid check-out data');
    }
    
    // Validate wallet address
    const employeeWallet = new PublicKey(checkOutData.employeeWallet);
    
    // Find the employee account PDA
    const [employeeAccount] = findEmployeeAccount(program, employeeWallet);
    
    // Find the work session account PDA
    const [workSessionAccount] = findWorkSessionAccount(
      program,
      employeeWallet,
      checkOutData.sessionId
    );
    
    // Get current timestamp
    const timestamp = checkOutData.timestamp || Math.floor(Date.now() / 1000);
    
    // Build and send the transaction
    const tx = await program.methods
      .checkOut(
        new BN(checkOutData.sessionId),
        new BN(timestamp)
      )
      .accounts({
        employee: employeeAccount,
        workSession: workSessionAccount,
        employeeWallet: employeeWallet,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('EMPLOYEE_CHECK_OUT', {
      employee: employeeAccount.toString(),
      workSession: workSessionAccount.toString(),
      sessionId: checkOutData.sessionId,
      timestamp,
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error checking out employee:', error);
    securityUtils.logSecurityEvent('CHECK_OUT_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Create a new payroll batch
 * @param {Program} program - Anchor program client
 * @param {Object} batchData - Batch data
 * @returns {Promise<string>} - Transaction signature
 */
export const createPayrollBatch = async (program, batchData) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate batch data
    if (!batchData.batchId) {
      throw new Error('Invalid batch data');
    }
    
    // Find the payroll batch account PDA
    const [payrollBatchAccount] = findPayrollBatchAccount(
      program,
      batchData.batchId
    );
    
    // Get current timestamp
    const timestamp = batchData.timestamp || Math.floor(Date.now() / 1000);
    
    // Build and send the transaction
    const tx = await program.methods
      .createPayrollBatch(
        new BN(batchData.batchId),
        new BN(timestamp)
      )
      .accounts({
        payrollBatch: payrollBatchAccount,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('PAYROLL_BATCH_CREATED', {
      payrollBatch: payrollBatchAccount.toString(),
      batchId: batchData.batchId,
      timestamp,
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error creating payroll batch:', error);
    securityUtils.logSecurityEvent('CREATE_BATCH_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Process a payroll batch
 * @param {Program} program - Anchor program client
 * @param {Object} batchData - Batch data
 * @param {Array} employeeAccounts - Array of employee accounts to pay
 * @param {Array} workSessionAccounts - Array of work session accounts to mark as paid
 * @returns {Promise<string>} - Transaction signature
 */
export const processPayroll = async (program, batchData, employeeAccounts, workSessionAccounts) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate batch data
    if (!batchData.batchId) {
      throw new Error('Invalid batch data');
    }
    
    // Validate accounts
    if (!Array.isArray(employeeAccounts) || !Array.isArray(workSessionAccounts)) {
      throw new Error('Invalid accounts');
    }
    
    // Find the payroll batch account PDA
    const [payrollBatchAccount] = findPayrollBatchAccount(
      program,
      batchData.batchId
    );
    
    // Get current timestamp
    const timestamp = batchData.timestamp || Math.floor(Date.now() / 1000);
    
    // Convert employee accounts to PublicKeys
    const employeePubkeys = employeeAccounts.map(account => {
      return new PublicKey(account);
    });
    
    // Convert work session accounts to PublicKeys
    const workSessionPubkeys = workSessionAccounts.map(account => {
      return new PublicKey(account);
    });
    
    // Build and send the transaction
    const tx = await program.methods
      .processPayroll(
        new BN(batchData.batchId),
        new BN(timestamp)
      )
      .accounts({
        payrollBatch: payrollBatchAccount,
        authority: program.provider.wallet.publicKey,
      })
      .remainingAccounts([
        ...employeePubkeys.map(pubkey => ({
          pubkey,
          isWritable: true,
          isSigner: false
        })),
        ...workSessionPubkeys.map(pubkey => ({
          pubkey,
          isWritable: true,
          isSigner: false
        }))
      ])
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('PAYROLL_PROCESSED', {
      payrollBatch: payrollBatchAccount.toString(),
      batchId: batchData.batchId,
      employeeCount: employeePubkeys.length,
      sessionCount: workSessionPubkeys.length,
      timestamp,
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error processing payroll:', error);
    securityUtils.logSecurityEvent('PROCESS_PAYROLL_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Mark a work session as paid
 * @param {Program} program - Anchor program client
 * @param {Object} sessionData - Session data
 * @returns {Promise<string>} - Transaction signature
 */
export const markSessionPaid = async (program, sessionData) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate session data
    if (!sessionData.employeeWallet || !sessionData.sessionId) {
      throw new Error('Invalid session data');
    }
    
    // Validate wallet address
    const employeeWallet = new PublicKey(sessionData.employeeWallet);
    
    // Find the work session account PDA
    const [workSessionAccount] = findWorkSessionAccount(
      program,
      employeeWallet,
      sessionData.sessionId
    );
    
    // Build and send the transaction
    const tx = await program.methods
      .markSessionPaid()
      .accounts({
        workSession: workSessionAccount,
        authority: program.provider.wallet.publicKey,
      })
      .rpc();
    
    // Log the transaction
    securityUtils.logSecurityEvent('SESSION_MARKED_PAID', {
      workSession: workSessionAccount.toString(),
      sessionId: sessionData.sessionId,
      tx
    });
    
    return tx;
  } catch (error) {
    console.error('Error marking session as paid:', error);
    securityUtils.logSecurityEvent('MARK_SESSION_PAID_ERROR', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Fetch an employee account
 * @param {Program} program - Anchor program client
 * @param {PublicKey} employeeWallet - Employee wallet address
 * @returns {Promise<Object>} - Employee account data
 */
export const fetchEmployee = async (program, employeeWallet) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate wallet address
    const walletPubkey = new PublicKey(employeeWallet);
    
    // Find the employee account PDA
    const [employeeAccount] = findEmployeeAccount(program, walletPubkey);
    
    // Fetch the account data
    const accountData = await program.account.employee.fetch(employeeAccount);
    
    // Format the data
    return {
      name: accountData.name,
      position: accountData.position,
      hourlyRate: accountData.hourlyRate.toNumber() / 100, // Convert from cents
      totalHoursWorked: accountData.totalHoursWorked.toNumber(),
      totalPaid: accountData.totalPaid.toNumber(),
      authority: accountData.authority.toString(),
      employeeWallet: accountData.employeeWallet.toString(),
      isActive: accountData.isActive
    };
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
};

/**
 * Fetch all employees
 * @param {Program} program - Anchor program client
 * @returns {Promise<Array>} - Array of employee account data
 */
export const fetchAllEmployees = async (program) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Fetch all employee accounts
    const accounts = await program.account.employee.all();
    
    // Format the data
    return accounts.map(account => ({
      publicKey: account.publicKey.toString(),
      name: account.account.name,
      position: account.account.position,
      hourlyRate: account.account.hourlyRate.toNumber() / 100, // Convert from cents
      totalHoursWorked: account.account.totalHoursWorked.toNumber(),
      totalPaid: account.account.totalPaid.toNumber(),
      authority: account.account.authority.toString(),
      employeeWallet: account.account.employeeWallet.toString(),
      isActive: account.account.isActive
    }));
  } catch (error) {
    console.error('Error fetching all employees:', error);
    throw error;
  }
};

/**
 * Fetch a work session account
 * @param {Program} program - Anchor program client
 * @param {PublicKey} employeeWallet - Employee wallet address
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object>} - Work session account data
 */
export const fetchWorkSession = async (program, employeeWallet, sessionId) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate wallet address
    const walletPubkey = new PublicKey(employeeWallet);
    
    // Find the work session account PDA
    const [workSessionAccount] = findWorkSessionAccount(program, walletPubkey, sessionId);
    
    // Fetch the account data
    const accountData = await program.account.workSession.fetch(workSessionAccount);
    
    // Format the data
    return {
      employee: accountData.employee.toString(),
      checkInTime: accountData.checkInTime.toNumber(),
      checkOutTime: accountData.checkOutTime.toNumber(),
      duration: accountData.duration.toNumber(),
      isPaid: accountData.isPaid,
      authority: accountData.authority.toString(),
      sessionId: accountData.sessionId.toNumber()
    };
  } catch (error) {
    console.error('Error fetching work session:', error);
    throw error;
  }
};

/**
 * Fetch all work sessions for an employee
 * @param {Program} program - Anchor program client
 * @param {PublicKey} employeeWallet - Employee wallet address
 * @returns {Promise<Array>} - Array of work session account data
 */
export const fetchEmployeeWorkSessions = async (program, employeeWallet) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Validate wallet address
    const walletPubkey = new PublicKey(employeeWallet);
    
    // Find the employee account PDA
    const [employeeAccount] = findEmployeeAccount(program, walletPubkey);
    
    // Fetch all work session accounts for this employee
    const accounts = await program.account.workSession.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: employeeAccount.toBase58()
        }
      }
    ]);
    
    // Format the data
    return accounts.map(account => ({
      publicKey: account.publicKey.toString(),
      employee: account.account.employee.toString(),
      checkInTime: account.account.checkInTime.toNumber(),
      checkOutTime: account.account.checkOutTime.toNumber(),
      duration: account.account.duration.toNumber(),
      isPaid: account.account.isPaid,
      authority: account.account.authority.toString(),
      sessionId: account.account.sessionId.toNumber()
    }));
  } catch (error) {
    console.error('Error fetching employee work sessions:', error);
    throw error;
  }
};

/**
 * Fetch all work sessions
 * @param {Program} program - Anchor program client
 * @returns {Promise<Array>} - Array of work session account data
 */
export const fetchAllWorkSessions = async (program) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Fetch all work session accounts
    const accounts = await program.account.workSession.all();
    
    // Format the data
    return accounts.map(account => ({
      publicKey: account.publicKey.toString(),
      employee: account.account.employee.toString(),
      checkInTime: account.account.checkInTime.toNumber(),
      checkOutTime: account.account.checkOutTime.toNumber(),
      duration: account.account.duration.toNumber(),
      isPaid: account.account.isPaid,
      authority: account.account.authority.toString(),
      sessionId: account.account.sessionId.toNumber()
    }));
  } catch (error) {
    console.error('Error fetching all work sessions:', error);
    throw error;
  }
};

/**
 * Fetch a payroll batch account
 * @param {Program} program - Anchor program client
 * @param {number} batchId - Batch ID
 * @returns {Promise<Object>} - Payroll batch account data
 */
export const fetchPayrollBatch = async (program, batchId) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Find the payroll batch account PDA
    const [payrollBatchAccount] = findPayrollBatchAccount(program, batchId);
    
    // Fetch the account data
    const accountData = await program.account.payrollBatch.fetch(payrollBatchAccount);
    
    // Format the data
    return {
      batchId: accountData.batchId.toNumber(),
      totalAmount: accountData.totalAmount.toNumber(),
      createdAt: accountData.createdAt.toNumber(),
      processedAt: accountData.processedAt.toNumber(),
      isProcessed: accountData.isProcessed,
      authority: accountData.authority.toString()
    };
  } catch (error) {
    console.error('Error fetching payroll batch:', error);
    throw error;
  }
};

/**
 * Fetch all payroll batches
 * @param {Program} program - Anchor program client
 * @returns {Promise<Array>} - Array of payroll batch account data
 */
export const fetchAllPayrollBatches = async (program) => {
  try {
    // Verify program is initialized
    if (!program) {
      throw new Error('Program not initialized');
    }
    
    // Fetch all payroll batch accounts
    const accounts = await program.account.payrollBatch.all();
    
    // Format the data
    return accounts.map(account => ({
      publicKey: account.publicKey.toString(),
      batchId: account.account.batchId.toNumber(),
      totalAmount: account.account.totalAmount.toNumber(),
      createdAt: account.account.createdAt.toNumber(),
      processedAt: account.account.processedAt.toNumber(),
      isProcessed: account.account.isProcessed,
      authority: account.account.authority.toString()
    }));
  } catch (error) {
    console.error('Error fetching all payroll batches:', error);
    throw error;
  }
};

export default {
  initializeProgram,
  findEmployerAccount,
  findEmployeeAccount,
  findWorkSessionAccount,
  findPayrollBatchAccount,
  initializeEmployer,
  registerEmployee,
  updateEmployee,
  checkIn,
  checkOut,
  createPayrollBatch,
  processPayroll,
  markSessionPaid,
  fetchEmployee,
  fetchAllEmployees,
  fetchWorkSession,
  fetchEmployeeWorkSessions,
  fetchAllWorkSessions,
  fetchPayrollBatch,
  fetchAllPayrollBatches
};