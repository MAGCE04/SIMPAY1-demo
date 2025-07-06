import React, { useState, useEffect } from 'react';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch payments from your Solana program
    const fetchPayments = async () => {
      try {
        // Mock data for demonstration
        const mockPayments = [
          {
            id: 1,
            date: Date.now() - 604800000, // 1 week ago
            amount: 250,
            hoursWorked: 10,
            batchId: 'BATCH-001'
          },
          {
            id: 2,
            date: Date.now() - 1209600000, // 2 weeks ago
            amount: 375,
            hoursWorked: 15,
            batchId: 'BATCH-002'
          },
          {
            id: 3,
            date: Date.now() - 1814400000, // 3 weeks ago
            amount: 500,
            hoursWorked: 20,
            batchId: 'BATCH-003'
          }
        ];
        
        setPayments(mockPayments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="payments">
      <h2>Payment History</h2>
      
      {payments.length === 0 ? (
        <div className="no-payments">
          <p>No payments found.</p>
        </div>
      ) : (
        <>
          <div className="payments-summary">
            <div className="summary-card">
              <h3>Payment Summary</h3>
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-label">Total Received</span>
                  <span className="stat-value">
                    ${payments.reduce((total, payment) => total + payment.amount, 0)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Hours Paid</span>
                  <span className="stat-value">
                    {payments.reduce((total, payment) => total + payment.hoursWorked, 0)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Last Payment</span>
                  <span className="stat-value">
                    ${payments[0]?.amount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="payments-list">
            <div className="payments-header">
              <div className="payment-date">Date</div>
              <div className="payment-amount">Amount</div>
              <div className="payment-hours">Hours</div>
              <div className="payment-batch">Batch ID</div>
              <div className="payment-status">Status</div>
            </div>
            
            {payments.map(payment => (
              <div key={payment.id} className="payment-item">
                <div className="payment-date">
                  {new Date(payment.date).toLocaleDateString()}
                </div>
                <div className="payment-amount">
                  ${payment.amount.toFixed(2)}
                </div>
                <div className="payment-hours">
                  {payment.hoursWorked}
                </div>
                <div className="payment-batch">
                  {payment.batchId}
                </div>
                <div className="payment-status">
                  <span className="status-badge completed">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Payments;