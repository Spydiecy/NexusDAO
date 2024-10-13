import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.svg" alt="NexusDAO" />
              <span className="ml-2 text-xl font-bold text-primary">NexusDAO</span>
            </Link>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`ml-4 px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.startsWith('/dashboard')
                      ? 'text-primary bg-primary bg-opacity-10'
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-opacity-90"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;