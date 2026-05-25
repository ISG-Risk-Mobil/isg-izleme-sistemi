const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  assignedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);