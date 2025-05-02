const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const DM = require('../models/DM');
const Server = require('../models/Server');

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const initializeSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, { online: true });
    io.emit('user-online', { userId: socket.userId });

    // Join user's rooms (servers and DMs)
    socket.on('join-server', async (serverId) => {
      const server = await Server.findById(serverId);
      const isMember = server && server.members.some(m => m.toString() === socket.userId);
      if (server && isMember) {
        socket.join(`server:${serverId}`);
        socket.emit('joined-server', { serverId });
      }
    });

    socket.on('leave-server', (serverId) => {
      socket.leave(`server:${serverId}`);
    });

    socket.on('join-channel', async (channelId) => {
      const channel = await Channel.findById(channelId);
      if (channel) {
        const server = await Server.findById(channel.serverId);
        const isMember = server && server.members.some(m => m.toString() === socket.userId);
        if (server && isMember) {
          socket.join(`channel:${channelId}`);
          socket.emit('joined-channel', { channelId });
        }
      }
    });

    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('join-dm', async (dmId) => {
      const dm = await DM.findById(dmId);
      const isParticipant = dm && dm.participants.some(p => p.toString() === socket.userId);
      if (dm && isParticipant) {
        socket.join(`dm:${dmId}`);
        socket.emit('joined-dm', { dmId });
      }
    });

    socket.on('leave-dm', (dmId) => {
      socket.leave(`dm:${dmId}`);
    });

    // Handle sending messages
    socket.on('send-message', async (data) => {
      try {
        const { content, channelId, dmId } = data;

        if (!content || content.trim().length === 0) {
          return socket.emit('error', { message: 'Message content is required' });
        }

        let message;
        if (channelId) {
          const channel = await Channel.findById(channelId);
          if (!channel) {
            return socket.emit('error', { message: 'Channel not found' });
          }

          message = new Message({
            content: content.trim(),
            userId: socket.userId,
            channelId,
          });
          await message.save();

          const populatedMessage = await Message.findById(message._id)
            .populate('userId', 'username avatar');

          io.to(`channel:${channelId}`).emit('new-message', populatedMessage);
        } else if (dmId) {
          const dm = await DM.findById(dmId);
          const isParticipant = dm && dm.participants.some(p => p.toString() === socket.userId);
          if (!dm || !isParticipant) {
            return socket.emit('error', { message: 'DM not found or access denied' });
          }

          message = new Message({
            content: content.trim(),
            userId: socket.userId,
            dmId,
          });
          await message.save();

          dm.messages.push(message._id);
          dm.updatedAt = Date.now();
          await dm.save();

          const populatedMessage = await Message.findById(message._id)
            .populate('userId', 'username avatar');

          io.to(`dm:${dmId}`).emit('new-message', populatedMessage);
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      const { channelId, dmId } = data;
      if (channelId) {
        socket.to(`channel:${channelId}`).emit('user-typing', {
          userId: socket.userId,
          username: socket.username,
          channelId,
        });
      } else if (dmId) {
        socket.to(`dm:${dmId}`).emit('user-typing', {
          userId: socket.userId,
          username: socket.username,
          dmId,
        });
      }
    });

    socket.on('typing-stop', (data) => {
      const { channelId, dmId } = data;
      if (channelId) {
        socket.to(`channel:${channelId}`).emit('user-stopped-typing', {
          userId: socket.userId,
          channelId,
        });
      } else if (dmId) {
        socket.to(`dm:${dmId}`).emit('user-stopped-typing', {
          userId: socket.userId,
          dmId,
        });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);
      await User.findByIdAndUpdate(socket.userId, { online: false });
      io.emit('user-offline', { userId: socket.userId });
    });
  });
};

module.exports = initializeSocket;

