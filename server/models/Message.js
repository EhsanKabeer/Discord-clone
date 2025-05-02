const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null,
  },
  dmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DM',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  edited: {
    type: Boolean,
    default: false,
  },
});

// Update updatedAt on save
messageSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.updatedAt = Date.now();
    this.edited = true;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);

