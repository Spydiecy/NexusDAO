import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

const App = () => {
  const { isAuthenticated, userProfile } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!userProfile) {
    return <Register />;
  }

  return <Dashboard />;
};

export default App;