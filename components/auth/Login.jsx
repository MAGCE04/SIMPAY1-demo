import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from './AuthContext';
import './Login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [verifyingWallet, setVerifyingWallet] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const { login, error: authError, loading } = useAuth();

  // Mock employee data for verification
  const mockEmployees = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Software Developer',
      walletAddress: '8ZU7Zs3k56UaKnELwdQXrKKmL9ZXyA3cHLQrXAP7pMjq'
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'UI/UX Designer',
      walletAddress: '6ZvxMC9U2MotLEQaCiZ3y2AKAjHpwVHBX3VBveLfUYw9'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      position: 'Project Manager',
      walletAddress: '4tQKBkLwLFVUyQZCWU5hbJoJyWGMFxXD7nUCpSuAUZHb'
    }
  ];

  // Check if wallet matches any employee when connected
  useEffect(() => {
    if (connected && publicKey) {
      setVerifyingWallet(true);
      
      // Find employee with matching wallet
      const matchingEmployee = mockEmployees.find(
        emp => emp.walletAddress === publicKey.toString()
      );
      
      if (matchingEmployee) {
        setEmployeeData(matchingEmployee);
      } else {
        setEmployeeData(null);
      }
      
      setVerifyingWallet(false);
    } else {
      setEmployeeData(null);
    }
  }, [connected, publicKey]);

  const handleLogin = async () => {
    if (!connected || !publicKey) {
      setLocalError('Please connect your wallet first');
      return;
    }

    if (!selectedRole) {
      setLocalError('Please select a role');
      return;
    }

    try {
      setLocalError('');
      
      // If employee role selected, verify wallet matches an employee
      if (selectedRole === 'employee' && !employeeData) {
        setLocalError('This wallet is not registered as an employee');
        return;
      }
      
      // Call login from auth context
      const success = await login(selectedRole, employeeData);
      
      if (success) {
        // Redirect to the appropriate dashboard
        navigate(selectedRole === 'employer' ? '/employer' : '/employee');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLocalError('Failed to login. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Employee Payroll System</h2>
        <p>Connect your wallet and select your role to continue</p>
        
        <div className="wallet-button-container">
          <WalletMultiButton />
        </div>
        
        {connected && (
          <>
            {verifyingWallet ? (
              <p>Verifying wallet...</p>
            ) : (
              <>
                {employeeData && (
                  <div className="employee-detected">
                    <p>Employee detected:</p>
                    <h4>{employeeData.name}</h4>
                    <p className="employee-position">{employeeData.position}</p>
                  </div>
                )}
                
                <div className="role-selection">
                  <h3>Select Your Role</h3>
                  <div className="role-buttons">
                    <button 
                      className={`role-button ${selectedRole === 'employer' ? 'selected' : ''}`}
                      onClick={() => setSelectedRole('employer')}
                    >
                      Employer
                    </button>
                    <button 
                      className={`role-button ${selectedRole === 'employee' ? 'selected' : ''}`}
                      onClick={() => setSelectedRole('employee')}
                      disabled={!employeeData}
                    >
                      Employee
                    </button>
                  </div>
                  
                  {selectedRole === 'employee' && !employeeData && (
                    <p className="role-warning">
                      This wallet is not registered as an employee
                    </p>
                  )}
                </div>
                
                <button 
                  className="login-button" 
                  onClick={handleLogin}
                  disabled={!selectedRole || loading || (selectedRole === 'employee' && !employeeData)}
                >
                  {loading ? 'Authenticating...' : 'Continue'}
                </button>
              </>
            )}
          </>
        )}
        
        {(localError || authError) && (
          <p className="error-message">{localError || authError}</p>
        )}
      </div>
    </div>
  );
};

export default Login;