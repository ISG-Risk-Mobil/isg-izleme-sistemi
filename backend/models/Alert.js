const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  // Alarmı tetikleyen kullanıcı
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Bağlı cihaz
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  // Alarm tipi
  type: {
    type: String,
    enum: ['fall', 'impact', 'stillness', 'anomaly', 'dangerous_zone', 'low_battery'],
    required: true
  },
  // Alarm seviyesi
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  // Alarm çözüldü mü
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: { type: Date },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema); 
