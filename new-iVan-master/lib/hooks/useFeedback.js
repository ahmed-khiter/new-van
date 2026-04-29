import { useState, useEffect } from 'react';

export function useFeedback() {
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreFeedbacks, setHasMoreFeedbacks] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch the next pending feedback
  const fetchNextPendingFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/feedbacks/pending');
      const data = await response.json();
      
      if (data.success) {
        setCurrentFeedback(data.data);
        setHasMoreFeedbacks(data.hasMore);
        setTotalCount(data.totalCount);
        
        // Show modal if there's a feedback
        if (data.data) {
          setShowFeedbackModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching pending feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmitted = async (feedbackId) => {
    setShowFeedbackModal(false);
    setCurrentFeedback(null);
    await fetchNextPendingFeedback();
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setCurrentFeedback(null);
  };

  // Check for pending feedbacks on mount
  useEffect(() => {
    fetchNextPendingFeedback();
  }, []);

  return {
    currentFeedback,
    showFeedbackModal,
    isLoading,
    hasMoreFeedbacks,
    totalCount,
    handleFeedbackSubmitted,
    closeFeedbackModal,
    fetchNextPendingFeedback
  };
}
