import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { NotFound } from './pages/NotFound';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Routes>
        <Route path="/" element={<Home onToast={addToast} />} />
        <Route path="/room/:roomId" element={<Room onToast={addToast} />} />
        <Route path="*" element={<NotFound onToast={addToast} />} />
      </Routes>
    </BrowserRouter>
  );
}
