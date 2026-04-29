import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            transports: ['websocket', 'polling'], // Add polling as fallback
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        // Connection event handlers
        socketInstance.on('connect', () => {
            console.log('WebSocket Connected to server:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('WebSocket Disconnected from server:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('WebSocket Connection error:', error.message);
            setIsConnected(false);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log('WebSocket Reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
        });

        socketInstance.on('reconnect_error', (error) => {
            console.error('WebSocket Reconnection error:', error.message);
        });

        // Cleanup on unmount
        return () => {
            console.log('Cleaning up WebSocket connection');
            socketInstance.disconnect();
        };
    }, []);

    return { socket, isConnected };
};

export const useChatSocket = (chatId) => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    useEffect(() => {
        if (!socket || !chatId) return;

        // Join chat room
        socket.emit('join-chat', chatId);

        // Listen for new messages
        const handleMessageReceived = (data) => {
            if (data.chatId === chatId) {
                setMessages(prev => [...prev, data.message]);
            }
        };

        // Listen for typing indicators
        const handleUserTyping = (data) => {
            if (data.chatId === chatId) {
                setTypingUsers(prev => {
                    if (data.isTyping) {
                        return [...prev.filter(user => user !== data.userId), data.userId];
                    } else {
                        return prev.filter(user => user !== data.userId);
                    }
                });
            }
        };

        socket.on('message-received', handleMessageReceived);
        socket.on('user-typing', handleUserTyping);

        // Cleanup
        return () => {
            socket.emit('leave-chat', chatId);
            socket.off('message-received', handleMessageReceived);
            socket.off('user-typing', handleUserTyping);
        };
    }, [socket, chatId]);

    const sendMessage = (message) => {
        if (socket && chatId) {
            socket.emit('new-message', {
                chatId,
                message
            });
        }
    };

    const sendTyping = (userId, isTyping) => {
        if (socket && chatId) {
            socket.emit('typing', {
                chatId,
                userId,
                isTyping
            });
        }
    };

    return {
        socket,
        isConnected,
        messages,
        typingUsers,
        sendMessage,
        sendTyping
    };
};

/**
 * Hook for delivery job notifications
 * Listens for real-time delivery job notifications and job acceptance updates
 * @param {number} providerId - The provider's user ID
 * @param {Object} providerLocation - Provider's current location {lat, lng}
 * @returns {Object} Delivery notifications state and handlers
 */
export const useDeliveryNotifications = (providerId, providerLocation = null) => {
    const { socket, isConnected } = useSocket();
    const [availableJobs, setAvailableJobs] = useState([]);
    const [jobNotifications, setJobNotifications] = useState([]);

    useEffect(() => {
        if (!socket || !providerId || !isConnected) return;

        // Join provider notification room
        socket.emit('join-provider-room', { providerId });
        console.log(`Provider ${providerId} joined notification room`);

        // Listen for new delivery jobs
        const handleDeliveryJobAvailable = (jobData) => {
            console.log('New delivery job available:', jobData);
            
            // Add distance calculation if provider location is available
            let enrichedJob = { ...jobData };
            if (providerLocation && providerLocation.lat && providerLocation.lng && jobData.pickupLat && jobData.pickupLng) {
                // Distance is already calculated on server, but we can verify
                // or recalculate if needed
                enrichedJob.providerDistance = jobData.distance || null;
            }

            // Add to available jobs if not already present
            setAvailableJobs(prev => {
                // Check if job already exists
                const exists = prev.some(job => job.jobId === jobData.jobId);
                if (exists) {
                    // Update existing job
                    return prev.map(job => 
                        job.jobId === jobData.jobId ? enrichedJob : job
                    );
                }
                // Add new job at the beginning (most recent first)
                return [enrichedJob, ...prev];
            });

            // Add to notifications
            setJobNotifications(prev => [{
                ...enrichedJob,
                timestamp: new Date(),
                type: 'new_job'
            }, ...prev]);
        };

        // Listen for job acceptance (remove from available jobs)
        const handleJobAccepted = (data) => {
            console.log('Job accepted:', data);
            
            // Remove job from available jobs if it was accepted by someone else
            if (data.acceptedBy !== providerId) {
                setAvailableJobs(prev => prev.filter(job => job.jobId !== data.jobId));
                
                // Add to notifications
                setJobNotifications(prev => [{
                    jobId: data.jobId,
                    acceptedBy: data.acceptedBy,
                    timestamp: new Date(data.timestamp),
                    type: 'job_accepted'
                }, ...prev]);
            }
        };

        // Register event listeners
        socket.on('delivery-job-available', handleDeliveryJobAvailable);
        socket.on('job-accepted', handleJobAccepted);

        // Cleanup
        return () => {
            socket.emit('leave-provider-room', { providerId });
            socket.off('delivery-job-available', handleDeliveryJobAvailable);
            socket.off('job-accepted', handleJobAccepted);
            console.log(`Provider ${providerId} left notification room`);
        };
    }, [socket, providerId, isConnected, providerLocation]);

    // Remove job from available list
    const removeJob = (jobId) => {
        setAvailableJobs(prev => prev.filter(job => job.jobId !== jobId));
    };

    // Clear notifications
    const clearNotifications = () => {
        setJobNotifications([]);
    };

    return {
        availableJobs,
        jobNotifications,
        isConnected,
        removeJob,
        clearNotifications,
        socket
    };
};