import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Components
import Login from './components/auth/Login';
import EmployerDashboard from './components/employer/Dashboard';
import EmployeeDashboard from './components/employee/Dashboard';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './components/auth/AuthContext';

// Styles
import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// Main app routes with authentication
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="content">
          <Routes>
            <Route path="/login" element={
              user ? (
                <Navigate to={user.role === 'employer' ? '/employer' : '/employee'} />
              ) : (
                <Login />
              )
            } />
            
            <Route path="/employer/*" element={
              <ProtectedRoute requiredRole="employer">
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/employee/*" element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={
              user ? (
                <Navigate to={user.role === 'employer' ? '/employer' : '/employee'} />
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

function App() {
  // Configure Solana wallet connection
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;