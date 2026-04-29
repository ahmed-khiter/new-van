import { useState, useEffect, useCallback } from 'react';

export const useChatCount = () => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChatCount = useCallback(async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const chats = await response.json();
        const totalUnreadCount = chats.reduce((total, chat) => total + (chat.unreadMessageCount || 0), 0);
        setCount(totalUnreadCount);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching chat count:', error);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchChatCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchChatCount]);

  // Listen for custom events to refresh count immediately
  useEffect(() => {
    const handleChatUpdate = () => {
      fetchChatCount();
    };

    // Listen for chat updates
    window.addEventListener('chatUpdated', handleChatUpdate);
    window.addEventListener('messageReceived', handleChatUpdate);
    window.addEventListener('messageRead', handleChatUpdate);
    
    return () => {
      window.removeEventListener('chatUpdated', handleChatUpdate);
      window.removeEventListener('messageReceived', handleChatUpdate);
      window.removeEventListener('messageRead', handleChatUpdate);
    };
  }, [fetchChatCount]);

  return { 
    count, 
    isLoading, 
    refetch: fetchChatCount,
    hasNotifications: count > 0
  };
};
