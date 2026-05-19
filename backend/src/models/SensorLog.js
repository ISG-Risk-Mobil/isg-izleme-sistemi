const mongoose = require('mongoose');

const sensorLogSchema = new mongoose.Schema({
  deviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Device', 
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  accelerometer: {
    x: { type: Number },
    y: { type: Number },
    z: { type: Number },
    magnitude: { type: Number }
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  gyroscope: {
    x: { type: Number },
    y: { type: Number },
    z: { type: Number }
  },
  batteryLevel: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('SensorLog', sensorLogSchema);