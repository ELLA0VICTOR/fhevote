import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/retroui/Sonner';
import { WalletProvider } from './context/WalletContext';
import { ErrorBoundary } from './components/retroui/common/ErrorBoundary';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { CreatePoll } from './pages/CreatePoll';
import { PollDetail } from './pages/PollDetail';
import { initFhevm } from './utils/fhevm';
import { LoadingSpinner } from './components/retroui/common/LoadingSpinner';

/**
 * Main App Component with FHEVM Initialization
 * 
 * CRITICAL: We initialize FHEVM SDK on app mount and block rendering
 * until initialization completes. This ensures all child components
 * can safely use encryption/decryption functions without race conditions.
 */
function App() {
  const [fhevmReady, setFhevmReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializingRef.current) {
      return;
    }
    initializingRef.current = true;

    const initialize = async () => {
      try {
        console.log('🚀 Initializing FHEVM SDK...');
        await initFhevm();
        setFhevmReady(true);
        console.log('✅ FHEVM SDK ready - App can now render');
      } catch (error) {
        console.error('❌ FHEVM initialization failed:', error);
        // Only show error if it's a real failure (not a transient WASM issue)
        // The retry logic in fhevm.js should handle most cases
        if (error.message && !error.message.includes('unwrap_throw')) {
          setInitError(error.message);
        } else {
          // For WASM errors, wait a bit and retry
          console.log('⚠️ Transient WASM error, retrying...');
          setTimeout(() => {
            initialize();
          }, 1500);
        }
      }
    };

    initialize();
  }, []);

  // Show loading screen while FHEVM initializes
  // This prevents child components from trying to use FHEVM before it's ready
  if (!fhevmReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <LoadingSpinner size={48} />
        <div className="text-center">
          <h2 className="font-head text-2xl mb-2">Initializing FHEVM SDK...</h2>
          <p className="text-muted-foreground">
            Loading encryption libraries for secure voting
          </p>
          {initError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg max-w-md">
              <p className="text-destructive font-medium">Initialization Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{initError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Only render app once FHEVM is fully initialized
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