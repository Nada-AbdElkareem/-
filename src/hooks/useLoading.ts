import { useState, useCallback } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  
  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await promise;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, setIsLoading, withLoading };
}
