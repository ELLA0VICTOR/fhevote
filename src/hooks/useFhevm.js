//deprecated and not in use currently but kept by me


import { useState, useEffect } from 'react';
import { initFhevm } from '../utils/fhevm';

export function useFhevm() {
  const [fhevm, setFhevm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const instance = await initFhevm();
        setFhevm(instance);
      } catch (err) {
        console.error('FHEVM initialization failed:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return { fhevm, loading, error };
}