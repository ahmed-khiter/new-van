const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3001;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const allowedOrigins = [
    process.env.NEXTAUTH_URL
  ].filter(Boolean); // Remove undefined values

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true, // Allow all origins if none specified
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Share Socket.IO instance with lib/socket.js for use in API routes
  import('./lib/socket.js').then(({ setSocket }) => {
    setSocket(io);
    console.log('Socket.IO instance shared with lib/socket.js');
  }).catch(err => {
    console.error('Failed to share Socket.IO instance:', err);
  });

  // Socket.IO event handlers
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

  // Start server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
