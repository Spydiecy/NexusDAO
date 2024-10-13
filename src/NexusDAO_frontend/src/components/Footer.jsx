import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white shadow-md mt-8">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} NexusDAO. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;