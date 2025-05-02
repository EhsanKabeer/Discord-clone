const Message = require('../models/Message');
const Channel = require('../models/Channel');
const DM = require('../models/DM');

// @route   GET /api/channels/:id/messages
// @desc    Get messages in channel
// @access  Private
exports.getChannelMessages = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const messages = await Message.find({ channelId: req.params.id })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/messages
// @desc    Create message
// @access  Private
exports.createMessage = async (req, res) => {
  try {
    const { content, channelId, dmId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (!channelId && !dmId) {
      return res.status(400).json({ message: 'Either channelId or dmId is required' });
    }

    // Validate channel or DM access
    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
    }

    if (dmId) {
      const dm = await DM.findById(dmId);
      if (!dm) {
        return res.status(404).json({ message: 'DM not found' });
      }
      if (!dm.participants.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not a participant in this DM' });
      }
    }

    const message = new Message({
      content: content.trim(),
      userId: req.user.id,
      channelId: channelId || null,
      dmId: dmId || null,
    });

    await message.save();

    if (dmId) {
      const dm = await DM.findById(dmId);
      dm.messages.push(message._id);
      dm.updatedAt = Date.now();
      await dm.save();
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('userId', 'username avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /api/messages/:id
// @desc    Update message
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content.trim();
    message.edited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('userId', 'username avatar');

    res.json(populatedMessage);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

