import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAuth } from '../auth/AuthContext';
import apiService from '../../utils/apiService';
import transactionService from '../../utils/transactionService';
import securityUtils from '../../utils/security';
import './PayrollManagement.css';

const PayrollManagement = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { user, hasPermission } = useAuth();
  
  const [unpaidSessions, setUnpaidSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [payrollBatches, setPayrollBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  const [program, setProgram] = useState(null);

  // Initialize program
  useEffect(() => {
    const initializeProgram = async () => {
      if (!wallet.connected || !wallet.publicKey || !connection) return;
      
      try {
        const program = apiService.initProgram(connection, wallet);
        setProgram(program);
      } catch (error) {
        console.error('Error initializing program:', error);
        setError('Failed to initialize Solana program. Please try again.');
      }
    };
    
    initializeProgram();
  }, [wallet.connected, wallet.publicKey, connection]);

  // Fetch payroll data
  useEffect(() => {
    const fetchPayrollData = async () => {
      if (!wallet.connected || !wallet.publicKey || !user || !program) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check permission
        if (!hasPermission('view', { type: 'payroll' })) {
          setError('You do not have permission to view payroll data');
          setLoading(false);
          return;
        }
        
        // Fetch unpaid work sessions
        const sessions = await apiService.fetchWorkSessions(
          connection,
          wallet,
          { isPaid: false },
          true // bypass cache to get fresh data
        );
        
        // Fetch payroll batches
        const batches = await apiService.fetchPayrollBatches(
          connection,
          wallet,
          true // bypass cache to get fresh data
        );
        
        setUnpaidSessions(sessions);
        setPayrollBatches(batches);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payroll data:', error);
        setError('Failed to load payroll data. Please try again.');
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, [wallet.connected, wallet.publicKey, connection, user, hasPermission, program]);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === unpaidSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(unpaidSessions.map(session => session.id));
    }
  };

  const handleSelectSession = (sessionId) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  const calculateTotalAmount = () => {
    return unpaidSessions
      .filter(session => selectedSessions.includes(session.id))
      .reduce((total, session) => total + session.amountDue, 0);
  };

  const handleCreateBatch = () => {
    if (selectedSessions.length === 0) return;
    
    try {
      // Validate selection
      if (!hasPermission('create', { type: 'payrollBatch' })) {
        setError('You do not have permission to create payroll batches');
        return;
      }
      
      // Generate a batch ID (timestamp-based for uniqueness)
      const batchId = Math.floor(Date.now() / 1000).toString();
      setCurrentBatchId(batchId);
      setShowConfirmation(true);
      setError(null);
    } catch (error) {
      console.error('Error creating batch:', error);
      setError('Failed to create payroll batch. Please try again.');
    }
  };

  const handleProcessPayroll = async () => {
    if (selectedSessions.length === 0) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Check permission
      if (!hasPermission('process', { type: 'payrollBatch' })) {
        throw new Error('You do not have permission to process payroll');
      }
      
      // Verify wallet is connected
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Step 1: Create a new payroll batch
      const createBatchResult = await apiService.createPayrollBatch(
        connection,
        wallet,
        selectedSessions
      );
      
      // Get the new batch
      const newBatch = createBatchResult.batch;
      
      // Step 2: Process the batch payments
      const selectedSessionsData = unpaidSessions.filter(session => 
        selectedSessions.includes(session.id)
      );
      
      // Create payment objects for each selected session
      const payments = selectedSessionsData.map(session => ({
        employeeId: session.employeeId,
        employeeWallet: session.employeeWallet,
        amount: Math.floor(session.amountDue * 1000000000), // Convert to lamports
        sessionId: session.sessionId
      }));
      
      // Process payments through the transaction service
      const paymentResult = await transactionService.processBatchPayments(
        payments,
        connection,
        wallet
      );
      
      // Step 3: Process the batch in the program
      const processBatchResult = await apiService.processPayrollBatch(
        connection,
        wallet,
        newBatch.id,
        selectedSessions
      );
      
      // Update state
      setPayrollBatches([processBatchResult.batch, ...payrollBatches]);
      
      // Remove paid sessions from unpaid list
      const remainingSessions = unpaidSessions.filter(
        session => !selectedSessions.includes(session.id)
      );
      
      setUnpaidSessions(remainingSessions);
      setSelectedSessions([]);
      
      // Set transaction result
      setTransactionResult({
        batchId: newBatch.id,
        totalPayments: payments.length,
        successfulPayments: paymentResult.successfulPayments || payments.length,
        signatures: [
          createBatchResult.signature,
          processBatchResult.signature,
          ...(paymentResult.results || []).map(r => r.signature).filter(Boolean)
        ]
      });
      
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error processing payroll:', error);
      setError(`Failed to process payroll: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading payroll data...</div>;
  }

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <h2>Payroll Management</h2>
      </div>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {transactionResult && (
        <div className="success-banner">
          <p>
            Successfully processed {transactionResult.successfulPayments} out of {transactionResult.totalPayments} payments.
            Batch ID: {transactionResult.batchId}
          </p>
          {transactionResult.signatures && transactionResult.signatures.length > 0 && (
            <div className="transaction-signatures">
              <p>Transaction signatures:</p>
              <ul>
                {transactionResult.signatures.map((sig, index) => (
                  <li key={index}>
                    <a 
                      href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {sig.substring(0, 8)}...{sig.substring(sig.length - 8)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => setTransactionResult(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="payroll-content">
        <div className="unpaid-sessions-section">
          <div className="section-header">
            <h3>Unpaid Work Sessions</h3>
            {unpaidSessions.length > 0 && (
              <div className="select-all">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSessions.length === unpaidSessions.length && unpaidSessions.length > 0}
                    onChange={handleSelectAll}
                  />
                  Select All
                </label>
              </div>
            )}
          </div>
          
          {unpaidSessions.length === 0 ? (
            <div className="no-sessions">
              <p>No unpaid work sessions found.</p>
            </div>
          ) : (
            <div className="sessions-table">
              <div className="table-header">
                <div className="header-cell checkbox-cell"></div>
                <div className="header-cell">Employee</div>
                <div className="header-cell">Date</div>
                <div className="header-cell">Duration</div>
                <div className="header-cell">Hourly Rate</div>
                <div className="header-cell">Amount Due</div>
              </div>
              
              <div className="table-body">
                {unpaidSessions.map(session => (
                  <div key={session.id} className="table-row">
                    <div className="cell checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.id)}
                        onChange={() => handleSelectSession(session.id)}
                      />
                    </div>
                    <div className="cell">{session.employeeName}</div>
                    <div className="cell">
                      {new Date(session.checkInTime).toLocaleDateString()}
                    </div>
                    <div className="cell">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="cell">${session.hourlyRate}/hr</div>
                    <div className="cell">${session.amountDue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {unpaidSessions.length > 0 && (
            <div className="payroll-summary">
              <div className="summary-details">
                <div className="summary-item">
                  <span>Selected Sessions:</span>
                  <span>{selectedSessions.length}</span>
                </div>
                <div className="summary-item">
                  <span>Total Amount:</span>
                  <span>${calculateTotalAmount().toFixed(2)}</span>
                </div>
              </div>
              
              <button
                className="process-button"
                disabled={selectedSessions.length === 0}
                onClick={handleCreateBatch}
              >
                Process Payroll
              </button>
            </div>
          )}
        </div>
        
        <div className="payroll-history-section">
          <h3>Payroll History</h3>
          
          {payrollBatches.length === 0 ? (
            <div className="no-batches">
              <p>No payroll batches found.</p>
            </div>
          ) : (
            <div className="batches-list">
              {payrollBatches.map(batch => (
                <div key={batch.id} className="batch-card">
                  <div className="batch-header">
                    <h4>{batch.id}</h4>
                    <span className={`status-badge ${batch.isProcessed ? 'completed' : 'pending'}`}>
                      {batch.isProcessed ? 'Processed' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="batch-details">
                    <div className="batch-detail">
                      <span>Date:</span>
                      <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="batch-detail">
                      <span>Sessions:</span>
                      <span>{batch.sessionCount}</span>
                    </div>
                    <div className="batch-detail">
                      <span>Total Amount:</span>
                      <span>${batch.totalAmount.toFixed(2)}</span>
                    </div>
                    {batch.processedAt && (
                      <div className="batch-detail">
                        <span>Processed:</span>
                        <span>{new Date(batch.processedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {batch.publicKey && (
                      <div className="batch-detail">
                        <span>Account:</span>
                        <span className="account-address">
                          <a 
                            href={`https://explorer.solana.com/address/${batch.publicKey}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {batch.publicKey.substring(0, 4)}...{batch.publicKey.substring(batch.publicKey.length - 4)}
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="modal confirmation-modal">
            <div className="modal-header">
              <h3>Confirm Payroll Processing</h3>
              <button 
                className="close-button"
                onClick={() => setShowConfirmation(false)}
                disabled={processing}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-content">
              <div className="security-notice">
                <p className="security-icon">🔒</p>
                <p>You are about to initiate a secure blockchain transaction</p>
              </div>
              
              <p>You are about to process payments for {selectedSessions.length} work sessions.</p>
              <p>Total amount: <strong>${calculateTotalAmount().toFixed(2)}</strong></p>
              <p>Batch ID: <strong>{currentBatchId}</strong></p>
              <p>This action will transfer funds from your account to the employees' wallets.</p>
              
              <div className="transaction-details">
                <h4>Transaction Details</h4>
                <div className="transaction-detail">
                  <span>From:</span>
                  <span className="wallet-address">{wallet.publicKey?.toString().substring(0, 6)}...{wallet.publicKey?.toString().substring(wallet.publicKey.toString().length - 4)}</span>
                </div>
                <div className="transaction-detail">
                  <span>Network Fee:</span>
                  <span>~0.000005 SOL</span>
                </div>
                <div className="transaction-detail">
                  <span>Network:</span>
                  <span>Solana Devnet</span>
                </div>
              </div>
              
              <div className="confirmation-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowConfirmation(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={handleProcessPayroll}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;