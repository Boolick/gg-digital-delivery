import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/routes/app-router';
import { ToastProvider } from './app/providers/toast-provider';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
