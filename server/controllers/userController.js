const User = require('../models/User');

// @route   GET /api/users
// @desc    Search users
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length === 0) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
      _id: { $ne: req.user.id }, // Exclude current user
    })
      .select('username email avatar online')
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

