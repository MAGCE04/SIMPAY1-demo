import { PublicKey } from '@solana/web3.js';

// Security constants
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_TRANSACTION_ATTEMPTS = 10;
const TRANSACTION_TIMEOUT = 30 * 1000; // 30 seconds in milliseconds

// Store for rate limiting
const rateLimitStore = {
  loginAttempts: new Map(), // Map of IP/wallet to timestamp array
  transactionAttempts: new Map(), // Map of wallet to timestamp array
  blockedWallets: new Set(), // Set of temporarily blocked wallets
};

/**
 * Check if a login attempt should be rate limited
 * @param {string} identifier - IP address or wallet address
 * @returns {boolean} - True if rate limited, false otherwise
 */
export const checkLoginRateLimit = (identifier) => {
  const now = Date.now();
  
  // Get attempts for this identifier
  let attempts = rateLimitStore.loginAttempts.get(identifier) || [];
  
  // Filter out attempts outside the window
  attempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check if blocked
  if (rateLimitStore.blockedWallets.has(identifier)) {
    return true;
  }
  
  // Check if too many attempts
  if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
    // Block this wallet for 15 minutes
    rateLimitStore.blockedWallets.add(identifier);
    setTimeout(() => {
      rateLimitStore.blockedWallets.delete(identifier);
    }, 15 * 60 * 1000);
    
    return true;
  }
  
  // Add this attempt
  attempts.push(now);
  rateLimitStore.loginAttempts.set(identifier, attempts);
  
  return false;
};

/**
 * Check if a transaction attempt should be rate limited
 * @param {string} wallet - Wallet address
 * @returns {boolean} - True if rate limited, false otherwise
 */
export const checkTransactionRateLimit = (wallet) => {
  const now = Date.now();
  
  // Get attempts for this wallet
  let attempts = rateLimitStore.transactionAttempts.get(wallet) || [];
  
  // Filter out attempts outside the window
  attempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check if too many attempts
  if (attempts.length >= MAX_TRANSACTION_ATTEMPTS) {
    return true;
  }
  
  // Add this attempt
  attempts.push(now);
  rateLimitStore.transactionAttempts.set(wallet, attempts);
  
  return false;
};

/**
 * Validate a Solana public key
 * @param {string} pubkeyString - Public key as string
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPublicKey = (pubkeyString) => {
  try {
    new PublicKey(pubkeyString);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Sanitize input to prevent XSS attacks
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generate a transaction ID for tracking
 * @returns {string} - Unique transaction ID
 */
export const generateTransactionId = () => {
  return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Create a timeout promise for transactions
 * @param {Promise} promise - The transaction promise
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} - Promise that rejects on timeout
 */
export const withTimeout = (promise, timeout = TRANSACTION_TIMEOUT) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Transaction timed out'));
    }, timeout);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Verify transaction parameters to prevent injection attacks
 * @param {Object} params - Transaction parameters
 * @returns {boolean} - True if valid, false otherwise
 */
export const verifyTransactionParams = (params) => {
  // Check for required parameters
  if (!params || typeof params !== 'object') {
    return false;
  }
  
  // Validate amounts are positive numbers
  if (params.amount && (isNaN(params.amount) || params.amount <= 0)) {
    return false;
  }
  
  // Validate public keys
  if (params.recipient && !isValidPublicKey(params.recipient)) {
    return false;
  }
  
  return true;
};

/**
 * Log security events for auditing
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
export const logSecurityEvent = (event, data) => {
  const timestamp = new Date().toISOString();
  console.log(`SECURITY_EVENT [${timestamp}] ${event}:`, data);
  
  // In a real app, you would send this to a secure logging service
};

/**
 * Verify a user has permission for an operation
 * @param {Object} user - User object
 * @param {string} operation - Operation name
 * @param {Object} resource - Resource being accessed
 * @returns {boolean} - True if permitted, false otherwise
 */
export const hasPermission = (user, operation, resource) => {
  if (!user || !user.role) {
    return false;
  }
  
  // Employer can do anything
  if (user.role === 'employer') {
    return true;
  }
  
  // Employee can only access their own data
  if (user.role === 'employee') {
    // For employee resources, check wallet matches
    if (resource.type === 'employee' && resource.walletAddress === user.wallet) {
      return true;
    }
    
    // For work sessions, check employee wallet matches
    if (resource.type === 'workSession' && resource.employeeWallet === user.wallet) {
      return true;
    }
    
    // For payments, check employee wallet matches
    if (resource.type === 'payment' && resource.employeeWallet === user.wallet) {
      return true;
    }
  }
  
  return false;
};

export default {
  checkLoginRateLimit,
  checkTransactionRateLimit,
  isValidPublicKey,
  sanitizeInput,
  generateTransactionId,
  withTimeout,
  verifyTransactionParams,
  logSecurityEvent,
  hasPermission
};