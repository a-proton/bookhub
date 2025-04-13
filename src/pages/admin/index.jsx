import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminRoute from '../pages/AdminRoute';

const Admin = () => {
  return (
    <Routes>
      <Route path="/*" element={<AdminRoute />} />
    </Routes>
  );
};

export default Admin;