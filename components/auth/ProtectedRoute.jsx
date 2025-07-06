import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  // Show loading indicator while checking authentication
  if (loading) {
    return <div className="loading">Verifying access...</div>;
  }
  
  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If user doesn't have the required role, redirect to their dashboard
  if (user.role !== requiredRole) {
    return <Navigate to={user.role === 'employer' ? '/employer' : '/employee'} />;
  }
  
  // If user has the correct role, render the children
  return children;
};

export default ProtectedRoute;