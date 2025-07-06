import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Employees from './Employees';
import PayrollManagement from './PayrollManagement';
import './Dashboard.css';

const Dashboard = () => {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch data from your Solana program
    const fetchDashboardData = async () => {
      try {
        // Mock data for demonstration
        setStats({
          totalEmployees: 5,
          activeEmployees: 3,
          totalHoursThisWeek: 120,
          unpaidSessions: 8
        });
        
        // Mock recent sessions
        setRecentSessions([
          {
            id: 1,
            employeeName: 'John Doe',
            checkInTime: Date.now() - 3600000, // 1 hour ago
            checkOutTime: Date.now() - 1800000, // 30 minutes ago
            duration: 1800, // 30 minutes in seconds
            isPaid: false
          },
          {
            id: 2,
            employeeName: 'Jane Smith',
            checkInTime: Date.now() - 7200000, // 2 hours ago
            checkOutTime: Date.now() - 3600000, // 1 hour ago
            duration: 3600, // 1 hour in seconds
            isPaid: false
          },
          {
            id: 3,
            employeeName: 'Mike Johnson',
            checkInTime: Date.now() - 10800000, // 3 hours ago
            checkOutTime: Date.now() - 7200000, // 2 hours ago
            duration: 3600, // 1 hour in seconds
            isPaid: false
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    if (publicKey) {
      fetchDashboardData();
    }
  }, [publicKey]);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="employer-dashboard">
          <div className="dashboard-header">
            <h2>Employer Dashboard</h2>
          </div>
          
          <div className="dashboard-content">
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon employees-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Employees</h3>
                  <p className="stat-value">{stats.totalEmployees}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon active-icon">✅</div>
                <div className="stat-info">
                  <h3>Active Now</h3>
                  <p className="stat-value">{stats.activeEmployees}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon hours-icon">⏱️</div>
                <div className="stat-info">
                  <h3>Hours This Week</h3>
                  <p className="stat-value">{stats.totalHoursThisWeek}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon unpaid-icon">💰</div>
                <div className="stat-info">
                  <h3>Unpaid Sessions</h3>
                  <p className="stat-value">{stats.unpaidSessions}</p>
                </div>
              </div>
            </div>
            
            <div className="dashboard-actions">
              <Link to="/employer/employees" className="action-button">
                Manage Employees
              </Link>
              <Link to="/employer/payroll" className="action-button primary">
                Process Payroll
              </Link>
            </div>
            
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              
              {recentSessions.length === 0 ? (
                <p>No recent activity</p>
              ) : (
                <div className="recent-sessions">
                  {recentSessions.map(session => (
                    <div key={session.id} className="session-card">
                      <div className="session-employee">{session.employeeName}</div>
                      <div className="session-details">
                        <div className="session-time">
                          <span>In: {new Date(session.checkInTime).toLocaleTimeString()}</span>
                          <span>Out: {new Date(session.checkOutTime).toLocaleTimeString()}</span>
                        </div>
                        <div className="session-duration">
                          Duration: {formatDuration(session.duration)}
                        </div>
                      </div>
                      <div className="session-status">
                        <span className={`status-badge ${session.isPaid ? 'paid' : 'unpaid'}`}>
                          {session.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      } />
      <Route path="/employees" element={<Employees />} />
      <Route path="/payroll" element={<PayrollManagement />} />
    </Routes>
  );
};

export default Dashboard;