import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueueProvider } from './context/QueueContext';
import AdminPanel from './components/AdminPanel';
import DisplayScreen from './components/DisplayScreen';

const App: React.FC = () => {
  return (
    <QueueProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/display" element={<DisplayScreen />} />
        </Routes>
      </HashRouter>
    </QueueProvider>
  );
};

export default App;