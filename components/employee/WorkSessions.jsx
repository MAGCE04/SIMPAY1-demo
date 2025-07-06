import React, { useState, useEffect } from 'react';
import './WorkSessions.css';

const WorkSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch work sessions from your Solana program
    const fetchWorkSessions = async () => {
      try {
        // Mock data for demonstration
        const storedSessions = JSON.parse(localStorage.getItem('workSessions') || '[]');
        
        // Add some mock data if none exists
        if (storedSessions.length === 0) {
          const mockSessions = [
            {
              id: 1,
              checkInTime: Date.now() - 86400000, // 1 day ago
              checkOutTime: Date.now() - 86370000, // 1 day ago + 30 minutes
              duration: 1800, // 30 minutes in seconds
              isPaid: true
            },
            {
              id: 2,
              checkInTime: Date.now() - 172800000, // 2 days ago
              checkOutTime: Date.now() - 172740000, // 2 days ago + 1 hour
              duration: 3600, // 1 hour in seconds
              isPaid: true
            },
            {
              id: 3,
              checkInTime: Date.now() - 259200000, // 3 days ago
              checkOutTime: Date.now() - 259110000, // 3 days ago + 1.5 hours
              duration: 5400, // 1.5 hours in seconds
              isPaid: false
            }
          ];
          
          setSessions(mockSessions);
        } else {
          setSessions(storedSessions);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching work sessions:', error);
        setLoading(false);
      }
    };

    fetchWorkSessions();
  }, []);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="loading">Loading work sessions...</div>;
  }

  return (
    <div className="work-sessions">
      <h2>Work Sessions</h2>
      
      {sessions.length === 0 ? (
        <div className="no-sessions">
          <p>No work sessions found.</p>
        </div>
      ) : (
        <div className="sessions-list">
          <div className="sessions-header">
            <div className="session-date">Date</div>
            <div className="session-time">Check In</div>
            <div className="session-time">Check Out</div>
            <div className="session-duration">Duration</div>
            <div className="session-status">Status</div>
          </div>
          
          {sessions.map(session => (
            <div key={session.id} className="session-item">
              <div className="session-date">
                {new Date(session.checkInTime).toLocaleDateString()}
              </div>
              <div className="session-time">
                {new Date(session.checkInTime).toLocaleTimeString()}
              </div>
              <div className="session-time">
                {session.checkOutTime 
                  ? new Date(session.checkOutTime).toLocaleTimeString() 
                  : 'Not checked out'}
              </div>
              <div className="session-duration">
                {session.checkOutTime 
                  ? formatDuration(Math.floor((session.checkOutTime - session.checkInTime) / 1000))
                  : 'In progress'}
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
  );
};

export default WorkSessions;