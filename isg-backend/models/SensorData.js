const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  // Veriyi gönderen kullanıcı
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Veriyi gönderen cihaz kimliği
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  // İvmeölçer verisi — düşme ve darbe tespitinde kullanılır
  accelerometer: {
    x: Number,
    y: Number,
    z: Number,
    magnitude: Number  
  },
  // Jiroskop verisi — dönme ve yön tespitinde kullanılır
  gyroscope: {
    x: Number,
    y: Number,
    z: Number
  },
  location: {
    lat: Number,  
    lng: Number, 
    accuracy: Number   
  },
  batteryLevel: Number 
}, { timestamps: true }); 

module.exports = mongoose.model('SensorData', SensorDataSchema); 
