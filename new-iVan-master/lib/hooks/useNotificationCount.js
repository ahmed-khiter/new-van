import { useState, useEffect, useCallback } from 'react';

export const useNotificationCount = () => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/count', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        const newCount = data?.count || 0;
        setCount(newCount);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  // Listen for custom events to refresh count immediately
  useEffect(() => {
    const handleNotificationUpdate = () => {
      fetchNotificationCount();
    };

    // Listen for various notification updates
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    window.addEventListener('chatUpdated', handleNotificationUpdate);
    window.addEventListener('messageReceived', handleNotificationUpdate);
    window.addEventListener('verificationUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      window.removeEventListener('chatUpdated', handleNotificationUpdate);
      window.removeEventListener('messageReceived', handleNotificationUpdate);
      window.removeEventListener('verificationUpdated', handleNotificationUpdate);
    };
  }, [fetchNotificationCount]);

  return { 
    count, 
    isLoading, 
    refetch: fetchNotificationCount,
    hasNotifications: count > 0
  };
};

