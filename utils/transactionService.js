import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import securityUtils from './security';

// Transaction status constants
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

// In-memory transaction store for demo purposes
// In a real app, this would be a database
const transactionStore = new Map();

/**
 * Create and send a payroll transaction
 * @param {Object} params - Transaction parameters
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @returns {Promise<Object>} - Transaction result
 */
export const createPayrollTransaction = async (params, connection, wallet) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Check rate limiting
    if (securityUtils.checkTransactionRateLimit(wallet.publicKey.toString())) {
      throw new Error('Too many transaction attempts. Please try again later.');
    }
    
    // Verify transaction parameters
    if (!securityUtils.verifyTransactionParams(params)) {
      securityUtils.logSecurityEvent('INVALID_TRANSACTION_PARAMS', {
        wallet: wallet.publicKey.toString(),
        params
      });
      throw new Error('Invalid transaction parameters');
    }
    
    // Generate transaction ID
    const txId = securityUtils.generateTransactionId();
    
    // Create transaction record
    const txRecord = {
      id: txId,
      status: TX_STATUS.PENDING,
      sender: wallet.publicKey.toString(),
      recipient: params.recipient,
      amount: params.amount,
      timestamp: Date.now(),
      confirmations: 0,
      signature: null,
      error: null
    };
    
    // Store transaction record
    transactionStore.set(txId, txRecord);
    
    // Log transaction creation
    securityUtils.logSecurityEvent('TRANSACTION_CREATED', {
      txId,
      sender: wallet.publicKey.toString(),
      recipient: params.recipient,
      amount: params.amount
    });
    
    // In a real app, you would call your Solana program to process the payroll
    // For demo purposes, we'll simulate a simple SOL transfer
    
    // Create a new transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(params.recipient),
        lamports: params.amount
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    
    // Send transaction with timeout
    const signature = await securityUtils.withTimeout(
      connection.sendRawTransaction(signedTransaction.serialize())
    );
    
    // Update transaction record
    txRecord.signature = signature;
    transactionStore.set(txId, txRecord);
    
    // Confirm transaction
    const confirmation = await securityUtils.withTimeout(
      connection.confirmTransaction(signature)
    );
    
    // Update transaction record
    txRecord.status = TX_STATUS.CONFIRMED;
    txRecord.confirmations = confirmation.value.confirmations;
    transactionStore.set(txId, txRecord);
    
    // Log transaction confirmation
    securityUtils.logSecurityEvent('TRANSACTION_CONFIRMED', {
      txId,
      signature,
      confirmations: confirmation.value.confirmations
    });
    
    return {
      success: true,
      txId,
      signature,
      confirmations: confirmation.value.confirmations
    };
  } catch (error) {
    console.error('Transaction error:', error);
    
    // If we have a transaction ID, update the record
    if (error.txId && transactionStore.has(error.txId)) {
      const txRecord = transactionStore.get(error.txId);
      txRecord.status = TX_STATUS.FAILED;
      txRecord.error = error.message;
      transactionStore.set(error.txId, txRecord);
    }
    
    // Log transaction error
    securityUtils.logSecurityEvent('TRANSACTION_FAILED', {
      wallet: wallet.publicKey?.toString(),
      error: error.message
    });
    
    throw error;
  }
};

/**
 * Get transaction status
 * @param {string} txId - Transaction ID
 * @returns {Object|null} - Transaction record or null if not found
 */
export const getTransactionStatus = (txId) => {
  return transactionStore.get(txId) || null;
};

/**
 * Get all transactions for a wallet
 * @param {string} walletAddress - Wallet address
 * @returns {Array} - Array of transaction records
 */
export const getWalletTransactions = (walletAddress) => {
  const transactions = [];
  
  for (const tx of transactionStore.values()) {
    if (tx.sender === walletAddress || tx.recipient === walletAddress) {
      transactions.push(tx);
    }
  }
  
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Process a batch of payroll payments
 * @param {Array} payments - Array of payment objects
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @returns {Promise<Object>} - Batch result
 */
export const processBatchPayments = async (payments, connection, wallet) => {
  try {
    // Verify wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Verify payments array
    if (!Array.isArray(payments) || payments.length === 0) {
      throw new Error('Invalid payments array');
    }
    
    // Generate batch ID
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Log batch creation
    securityUtils.logSecurityEvent('BATCH_CREATED', {
      batchId,
      paymentCount: payments.length,
      sender: wallet.publicKey.toString()
    });
    
    // Process each payment
    const results = [];
    
    for (const payment of payments) {
      try {
        const result = await createPayrollTransaction(
          {
            recipient: payment.employeeWallet,
            amount: payment.amount
          },
          connection,
          wallet
        );
        
        results.push({
          employeeId: payment.employeeId,
          success: true,
          txId: result.txId,
          signature: result.signature
        });
      } catch (error) {
        results.push({
          employeeId: payment.employeeId,
          success: false,
          error: error.message
        });
      }
    }
    
    // Log batch completion
    securityUtils.logSecurityEvent('BATCH_COMPLETED', {
      batchId,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    });
    
    return {
      batchId,
      totalPayments: payments.length,
      successfulPayments: results.filter(r => r.success).length,
      failedPayments: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    console.error('Batch payment error:', error);
    
    // Log batch error
    securityUtils.logSecurityEvent('BATCH_FAILED', {
      error: error.message
    });
    
    throw error;
  }
};

export default {
  createPayrollTransaction,
  getTransactionStatus,
  getWalletTransactions,
  processBatchPayments,
  TX_STATUS
};