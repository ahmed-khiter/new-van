import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.NEXTAUTH_URL,
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a chat room
        socket.on('join-chat', (chatId) => {
            socket.join(`chat-${chatId}`);
            console.log(`User ${socket.id} joined chat ${chatId}`);
        });

        // Leave a chat room
        socket.on('leave-chat', (chatId) => {
            socket.leave(`chat-${chatId}`);
            console.log(`User ${socket.id} left chat ${chatId}`);
        });

        // Handle new message
        socket.on('new-message', (data) => {
            const { chatId, message } = data;
            // Broadcast to all users in the chat room except sender
            socket.to(`chat-${chatId}`).emit('message-received', {
                chatId,
                message
            });
        });

        // Handle mark as read
        socket.on('mark-as-read', (data) => {
            const { chatId, unreadCount } = data;
            // Broadcast unread count update to all users in the chat room
            io.to(`chat-${chatId}`).emit('unread-update', {
                chatId,
                unreadCount
            });
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { chatId, userId, isTyping } = data;
            socket.to(`chat-${chatId}`).emit('user-typing', {
                chatId,
                userId,
                isTyping
            });
        });

        // Delivery System Socket Events
        
        // Provider joins their notification room
        socket.on('join-provider-room', (data) => {
            const { providerId } = data;
            if (providerId) {
                socket.join(`provider-${providerId}`);
                // Store providerId in socket data for later use
                socket.data.providerId = providerId;
                console.log(`Provider ${providerId} (socket ${socket.id}) joined notification room`);
            }
        });

        // Provider leaves their notification room
        socket.on('leave-provider-room', (data) => {
            const { providerId } = data;
            if (providerId) {
                socket.leave(`provider-${providerId}`);
                delete socket.data.providerId;
                console.log(`Provider ${providerId} (socket ${socket.id}) left notification room`);
            }
        });

        // Track job decline (for analytics)
        socket.on('job-declined', (data) => {
            const { jobId, providerId, reason } = data;
            console.log(`Provider ${providerId} declined job ${jobId}${reason ? `: ${reason}` : ''}`);
            // This can be used for analytics or future features
            // For now, just log it
        });

        // Join user room for order status updates
        socket.on('join-user-room', (data) => {
            const { userId } = data;
            if (userId) {
                socket.join(`user-${userId}`);
                socket.data.userId = userId;
                console.log(`User ${userId} (socket ${socket.id}) joined user room`);
            }
        });

        // Leave user room
        socket.on('leave-user-room', (data) => {
            const { userId } = data;
            if (userId) {
                socket.leave(`user-${userId}`);
                delete socket.data.userId;
                console.log(`User ${userId} (socket ${socket.id}) left user room`);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const providerId = socket.data?.providerId;
            if (providerId) {
                console.log(`Provider ${providerId} (socket ${socket.id}) disconnected`);
            } else {
                console.log('User disconnected:', socket.id);
            }
        });
    });

    return io;
};

export const setSocket = (socketInstance) => {
    io = socketInstance;
};

export const getSocket = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
