import { useState, useEffect, useCallback } from 'react';

export const useVerificationCount = () => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVerificationCount = useCallback(async () => {
    try {
      const response = await fetch('/api/pending-verifications');
      if (response.ok) {
        const data = await response.json();
        const newCount = data?.pendingVerifications?.length || 0;
        setCount(newCount);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching verification count:', error);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerificationCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchVerificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchVerificationCount]);

  // Listen for custom events to refresh count immediately
  useEffect(() => {
    const handleVerificationUpdate = () => {
      fetchVerificationCount();
    };

    // Listen for verification updates
    window.addEventListener('verificationUpdated', handleVerificationUpdate);
    window.addEventListener('documentVerified', handleVerificationUpdate);
    
    return () => {
      window.removeEventListener('verificationUpdated', handleVerificationUpdate);
      window.removeEventListener('documentVerified', handleVerificationUpdate);
    };
  }, [fetchVerificationCount]);

  return { 
    count, 
    isLoading, 
    refetch: fetchVerificationCount,
    hasNotifications: count > 0
  };
};
