import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.username}</h1>
          <p className="mt-1 text-sm text-gray-600">Role: {user?.role}</p>
        </div>
        <div className="px-4 py-6 sm:px-0">
          <nav className="flex space-x-4">
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm rounded-md"
            >
              Overview
            </Link>
            <Link
              to="/dashboard/tasks"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm rounded-md"
            >
              Tasks
            </Link>
            <Link
              to="/dashboard/create-task"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm rounded-md"
            >
              Create Task
            </Link>
            <Link
              to="/dashboard/profile"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm rounded-md"
            >
              Profile
            </Link>
          </nav>
        </div>
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;