import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import WorkSessions from './WorkSessions';
import Payments from './Payments';
import './Dashboard.css';

const Dashboard = () => {
  const { publicKey } = useWallet();
  const [employee, setEmployee] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch employee data from your Solana program
    const fetchEmployeeData = async () => {
      try {
        // Mock data for demonstration
        setEmployee({
          name: 'John Doe',
          position: 'Software Developer',
          hourlyRate: 25,
          totalHoursWorked: 120,
          totalPaid: 3000,
          isActive: true
        });
        
        // Check if employee is currently checked in
        const mockCurrentSession = localStorage.getItem('currentSession');
        if (mockCurrentSession) {
          const session = JSON.parse(mockCurrentSession);
          setIsCheckedIn(true);
          setCurrentSession(session);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employee data:', error);
        setLoading(false);
      }
    };

    if (publicKey) {
      fetchEmployeeData();
    }
  }, [publicKey]);

  const handleCheckIn = async () => {
    try {
      // In a real app, you would call your Solana program to check in
      const timestamp = Date.now();
      const sessionId = Math.floor(Math.random() * 1000000);
      
      const newSession = {
        id: sessionId,
        checkInTime: timestamp,
        checkOutTime: null
      };
      
      // Store in localStorage for demo purposes
      localStorage.setItem('currentSession', JSON.stringify(newSession));
      
      setIsCheckedIn(true);
      setCurrentSession(newSession);
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      // In a real app, you would call your Solana program to check out
      if (currentSession) {
        const timestamp = Date.now();
        const updatedSession = {
          ...currentSession,
          checkOutTime: timestamp
        };
        
        // Update localStorage for demo purposes
        localStorage.removeItem('currentSession');
        
        // In a real app, you would store this in your Solana program
        const sessions = JSON.parse(localStorage.getItem('workSessions') || '[]');
        sessions.push(updatedSession);
        localStorage.setItem('workSessions', JSON.stringify(sessions));
        
        setIsCheckedIn(false);
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Check-out error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="employee-dashboard">
          <div className="dashboard-header">
            <h2>Employee Dashboard</h2>
            {employee && (
              <div className="employee-info">
                <h3>{employee.name}</h3>
                <p>{employee.position}</p>
              </div>
            )}
          </div>
          
          <div className="dashboard-content">
            <div className="check-in-out-card">
              <h3>Time Tracking</h3>
              <div className="time-display">
                <div className="current-time">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="current-date">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              
              {isCheckedIn ? (
                <div className="checked-in-status">
                  <div className="status-indicator active"></div>
                  <p>You are currently checked in</p>
                  <p className="check-in-time">
                    Since: {new Date(currentSession.checkInTime).toLocaleTimeString()}
                  </p>
                  <button 
                    className="check-button check-out" 
                    onClick={handleCheckOut}
                  >
                    Check Out
                  </button>
                </div>
              ) : (
                <div className="checked-out-status">
                  <div className="status-indicator"></div>
                  <p>You are not checked in</p>
                  <button 
                    className="check-button check-in" 
                    onClick={handleCheckIn}
                  >
                    Check In
                  </button>
                </div>
              )}
            </div>
            
            <div className="dashboard-summary">
              <div className="summary-card">
                <h3>Work Summary</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Hours Worked</span>
                    <span className="stat-value">{employee?.totalHoursWorked || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Paid</span>
                    <span className="stat-value">${employee?.totalPaid || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Hourly Rate</span>
                    <span className="stat-value">${employee?.hourlyRate || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="quick-links">
                <Link to="/employee/sessions" className="quick-link">
                  View Work History
                </Link>
                <Link to="/employee/payments" className="quick-link">
                  View Payments
                </Link>
              </div>
            </div>
          </div>
        </div>
      } />
      <Route path="/sessions" element={<WorkSessions />} />
      <Route path="/payments" element={<Payments />} />
    </Routes>
  );
};

export default Dashboard;