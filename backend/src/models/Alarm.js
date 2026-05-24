const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  deviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Device', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: { 
    type: String, 
    enum: [
      'HARD_IMPACT',
      'FALL_DETECTED',
      'INACTIVITY',
      'DANGEROUS_ZONE',
      'HIGH_RISK_SCORE',
      'LOW_BATTERY',
      'PPE_VIOLATION'
    ],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true 
  },
  description: { type: String },
  sensorData: { type: Object },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Alarm', alarmSchema);