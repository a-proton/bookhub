import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer.jsx';

const AUTH_PATHS = ['/login', '/SignUpPage'];

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow w-full">
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

export default Layout;