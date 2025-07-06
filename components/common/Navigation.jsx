import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../auth/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const { disconnect } = useWallet();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Use auth context logout
      const success = await logout();
      
      if (success) {
        // Redirect to login
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>PayTrack</h1>
        </Link>
      </div>
      
      <div className="navbar-menu">
        {user && (
          <>
            <div className="navbar-links">
              {user.role === 'employer' && (
                <>
                  <Link to="/employer" className="nav-link">Dashboard</Link>
                  <Link to="/employer/employees" className="nav-link">Employees</Link>
                  <Link to="/employer/payroll" className="nav-link">Payroll</Link>
                </>
              )}
              
              {user.role === 'employee' && (
                <>
                  <Link to="/employee" className="nav-link">Dashboard</Link>
                  <Link to="/employee/sessions" className="nav-link">Work Sessions</Link>
                  <Link to="/employee/payments" className="nav-link">Payments</Link>
                </>
              )}
            </div>
            
            <div className="user-info">
              {user.name && <span className="user-name">{user.name}</span>}
              <span className="wallet-address">{formatWalletAddress(user.wallet)}</span>
            </div>
          </>
        )}
        
        <div className="navbar-auth">
          {user ? (
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <WalletMultiButton />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;