const mongoose = require('mongoose');

const dmSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure participants array has exactly 2 users
dmSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('DM must have exactly 2 participants'));
  }
  this.updatedAt = Date.now();
  next();
});

// Create unique index for participants to prevent duplicate DMs
dmSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('DM', dmSchema);

