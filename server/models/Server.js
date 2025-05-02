const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Server name is required'],
    trim: true,
    maxlength: [50, 'Server name cannot exceed 50 characters'],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  }],
  icon: {
    type: String,
    default: `https://api.dicebear.com/7.x/shapes/svg?seed=${Math.random()}`,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add owner to members array on creation
serverSchema.pre('save', function (next) {
  if (this.isNew && !this.members.includes(this.ownerId)) {
    this.members.push(this.ownerId);
  }
  next();
});

module.exports = mongoose.model('Server', serverSchema);

