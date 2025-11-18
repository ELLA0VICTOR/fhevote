import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/retroui/Sonner';
import { WalletProvider } from './context/WalletContext';
import { ErrorBoundary } from './components/retroui/common/ErrorBoundary';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { CreatePoll } from './pages/CreatePoll';
import { PollDetail } from './pages/PollDetail';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePoll />} />
                <Route path="/poll/:id" element={<PollDetail />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" />
        </WalletProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;