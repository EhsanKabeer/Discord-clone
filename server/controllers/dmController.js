const DM = require('../models/DM');
const Message = require('../models/Message');

// @route   GET /api/dms
// @desc    Get user's DM conversations
// @access  Private
exports.getDMs = async (req, res) => {
  try {
    const dms = await DM.find({
      participants: req.user.id,
    })
      .populate('participants', 'username avatar online')
      .populate({
        path: 'messages',
        populate: {
          path: 'userId',
          select: 'username avatar',
        },
        options: { sort: { createdAt: -1 }, limit: 1 },
      })
      .sort({ updatedAt: -1 });

    res.json(dms);
  } catch (error) {
    console.error('Get DMs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/dms
// @desc    Create/initiate DM conversation
// @access  Private
exports.createDM = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId === req.user.id.toString()) {
      return res.status(400).json({ message: 'Cannot create DM with yourself' });
    }

    // Check if DM already exists
    let dm = await DM.findOne({
      participants: { $all: [req.user.id, userId] },
    });

    if (dm) {
      const populatedDM = await DM.findById(dm._id)
        .populate('participants', 'username avatar online')
        .populate({
          path: 'messages',
          populate: {
            path: 'userId',
            select: 'username avatar',
          },
        });
      return res.json(populatedDM);
    }

    // Create new DM
    dm = new DM({
      participants: [req.user.id, userId],
    });

    await dm.save();

    const populatedDM = await DM.findById(dm._id)
      .populate('participants', 'username avatar online');

    res.status(201).json(populatedDM);
  } catch (error) {
    console.error('Create DM error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/dms/:id/messages
// @desc    Get messages in DM
// @access  Private
exports.getDMMessages = async (req, res) => {
  try {
    const dm = await DM.findById(req.params.id);

    if (!dm) {
      return res.status(404).json({ message: 'DM not found' });
    }

    if (!dm.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a participant in this DM' });
    }

    const messages = await Message.find({ dmId: req.params.id })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get DM messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

