import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import securityUtils from '../../utils/security';

// Create the authentication context
const AuthContext = createContext(null);

// Session duration in milliseconds (2 hours)
const SESSION_DURATION = 2 * 60 * 60 * 1000;

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { connected, publicKey, signMessage, disconnect } = useWallet();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Check if user is authenticated on wallet connection change or session expiry
  useEffect(() => {
    const checkAuth = async () => {
      if (connected && publicKey) {
        try {
          // Check if we have stored auth data
          const storedAuth = localStorage.getItem('auth');
          
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            
            // Check if session has expired
            if (authData.expiry && new Date(authData.expiry) < new Date()) {
              // Session expired, clear auth data
              localStorage.removeItem('auth');
              setUser(null);
              setError('Session expired. Please login again.');
              setLoading(false);
              return;
            }
            
            // Verify the stored wallet matches the connected wallet
            if (authData.wallet === publicKey.toString()) {
              setUser({
                wallet: publicKey.toString(),
                role: authData.role,
                name: authData.name || null,
                verified: true,
                sessionId: authData.sessionId
              });
              setSessionExpiry(authData.expiry);
              setLoading(false);
              return;
            }
          }
          
          // If we reach here, either no stored auth or wallet mismatch
          setUser(null);
          setLoading(false);
        } catch (err) {
          console.error('Auth check error:', err);
          setError('Failed to verify authentication');
          setUser(null);
          setLoading(false);
        }
      } else {
        // No wallet connected
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
    
    // Set up session expiry check
    const checkInterval = setInterval(() => {
      if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
        // Session expired, log out user
        logout();
        setError('Session expired. Please login again.');
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [connected, publicKey, sessionExpiry]);

  // Authenticate user with role
  const login = async (role, employeeData = null) => {
    if (!connected || !publicKey || !signMessage) {
      setError('Wallet not connected or does not support signing');
      return false;
    }

    try {
      setLoading(true);
      
      // Check rate limiting
      const walletAddress = publicKey.toString();
      if (securityUtils.checkLoginRateLimit(walletAddress)) {
        setError('Too many login attempts. Please try again later.');
        setLoading(false);
        return false;
      }
      
      // Increment login attempts
      setLoginAttempts(prev => prev + 1);
      
      // Generate a unique challenge with timestamp to prevent replay attacks
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // Create a message to sign with nonce and timestamp
      const message = new TextEncoder().encode(
        `Sign this message to authenticate as ${role} with the Employee Payroll System.\nNonce: ${nonce}\nTimestamp: ${timestamp}`
      );
      
      // Ask user to sign the message
      const signature = await securityUtils.withTimeout(signMessage(message));
      
      // In a real app, you would send the signature, public key, nonce, and timestamp to your backend for verification
      
      // Verify the role against your Solana program data
      const isVerified = await verifyRole(publicKey, role, employeeData);
      
      if (!isVerified) {
        securityUtils.logSecurityEvent('FAILED_ROLE_VERIFICATION', {
          wallet: walletAddress,
          role,
          timestamp
        });
        
        setError(`Could not verify you as a ${role}`);
        setLoading(false);
        return false;
      }
      
      // Generate session expiry (2 hours from now)
      const expiry = new Date(Date.now() + SESSION_DURATION).toISOString();
      
      // Generate a unique session ID
      const sessionId = `session-${timestamp}-${nonce}`;
      
      // Create user object
      const userData = {
        wallet: walletAddress,
        role: role,
        name: employeeData?.name || null,
        verified: true,
        sessionId,
        expiry,
        lastActive: new Date().toISOString()
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('auth', JSON.stringify(userData));
      
      // Log successful login
      securityUtils.logSecurityEvent('SUCCESSFUL_LOGIN', {
        wallet: walletAddress,
        role,
        sessionId,
        timestamp
      });
      
      // Update state
      setUser(userData);
      setSessionExpiry(expiry);
      setError(null);
      setLoginAttempts(0);
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      
      // Log failed login attempt
      if (publicKey) {
        securityUtils.logSecurityEvent('FAILED_LOGIN', {
          wallet: publicKey.toString(),
          error: err.message,
          attempts: loginAttempts + 1
        });
      }
      
      setError('Authentication failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  // Verify user role against Solana program data
  const verifyRole = async (publicKey, role, employeeData) => {
    try {
      // Validate public key
      if (!securityUtils.isValidPublicKey(publicKey.toString())) {
        return false;
      }
      
      // In a real app, you would query your Solana program to verify:
      // - For employers: Check if they own the employer account
      // - For employees: Check if their wallet is in the employee list
      
      // For demo purposes, we'll simulate verification
      if (role === 'employer') {
        // Mock employer verification - in real app, check against program data
        // For demo, we'll allow any wallet to be an employer
        return true;
      } else if (role === 'employee') {
        // Mock employee verification - in real app, check against program data
        
        // If employeeData is provided, use it for verification
        if (employeeData) {
          return employeeData.walletAddress === publicKey.toString();
        }
        
        // Otherwise, check against mock employee list
        const mockEmployees = [
          {
            id: 1,
            name: 'John Doe',
            walletAddress: '8ZU7Zs3k56UaKnELwdQXrKKmL9ZXyA3cHLQrXAP7pMjq'
          },
          {
            id: 2,
            name: 'Jane Smith',
            walletAddress: '6ZvxMC9U2MotLEQaCiZ3y2AKAjHpwVHBX3VBveLfUYw9'
          },
          {
            id: 3,
            name: 'Mike Johnson',
            walletAddress: '4tQKBkLwLFVUyQZCWU5hbJoJyWGMFxXD7nUCpSuAUZHb'
          }
        ];
        
        // Check if the wallet is in our employee list
        return mockEmployees.some(emp => emp.walletAddress === publicKey.toString());
      }
      
      return false;
    } catch (err) {
      console.error('Role verification error:', err);
      return false;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Log the logout event if user exists
      if (user) {
        securityUtils.logSecurityEvent('LOGOUT', {
          wallet: user.wallet,
          sessionId: user.sessionId
        });
      }
      
      // Remove auth data from localStorage
      localStorage.removeItem('auth');
      
      // Disconnect wallet
      if (disconnect) {
        await disconnect();
      }
      
      // Update state
      setUser(null);
      setSessionExpiry(null);
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      return false;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has permission for an operation
  const hasPermission = (operation, resource) => {
    return user ? securityUtils.hasPermission(user, operation, resource) : false;
  };

  // Refresh the session
  const refreshSession = () => {
    if (user) {
      // Generate new expiry (2 hours from now)
      const expiry = new Date(Date.now() + SESSION_DURATION).toISOString();
      
      // Update user data
      const updatedUser = {
        ...user,
        lastActive: new Date().toISOString(),
        expiry
      };
      
      // Update localStorage
      localStorage.setItem('auth', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      setSessionExpiry(expiry);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasPermission,
    refreshSession,
    sessionExpiry
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;