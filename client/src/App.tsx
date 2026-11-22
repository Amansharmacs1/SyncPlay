import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.js';
import { WatchRoomPage } from './pages/WatchRoomPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { ToastContainer } from './components/common/ToastContainer.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<WatchRoomPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
