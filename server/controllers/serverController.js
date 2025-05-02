const Server = require('../models/Server');
const Channel = require('../models/Channel');

// @route   GET /api/servers
// @desc    Get user's servers
// @access  Private
exports.getServers = async (req, res) => {
  try {
    const servers = await Server.find({
      members: req.user.id,
    })
      .populate('ownerId', 'username avatar')
      .populate('members', 'username avatar online')
      .sort({ createdAt: -1 });

    res.json(servers);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/servers
// @desc    Create new server
// @access  Private
exports.createServer = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Server name is required' });
    }

    const server = new Server({
      name: name.trim(),
      ownerId: req.user.id,
    });

    await server.save();

    // Create default "general" channel
    const generalChannel = new Channel({
      name: 'general',
      serverId: server._id,
      type: 'text',
    });
    await generalChannel.save();

    server.channels.push(generalChannel._id);
    await server.save();

    const populatedServer = await Server.findById(server._id)
      .populate('ownerId', 'username avatar')
      .populate('members', 'username avatar online')
      .populate('channels');

    res.status(201).json(populatedServer);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/servers/:id/channels
// @desc    Get channels in server
// @access  Private
exports.getChannels = async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const channels = await Channel.find({ serverId: req.params.id }).sort({ createdAt: 1 });
    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/servers/:id/channels
// @desc    Create channel in server
// @access  Private
exports.createChannel = async (req, res) => {
  try {
    const { name, type } = req.body;
    const serverId = req.params.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only server owner can create channels' });
    }

    const channel = new Channel({
      name: name.trim(),
      serverId,
      type: type || 'text',
    });

    await channel.save();

    server.channels.push(channel._id);
    await server.save();

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

