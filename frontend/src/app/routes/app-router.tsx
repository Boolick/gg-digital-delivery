import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../../pages/home';
import { OrderStatusPage } from '../../pages/order-status';
import { AdminPage } from '../../pages/admin';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/order/:id" element={<OrderStatusPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};
