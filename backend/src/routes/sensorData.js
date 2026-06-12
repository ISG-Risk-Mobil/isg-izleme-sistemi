const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SensorLog = require('../models/SensorLog');
const Device = require('../models/Device');
const Alarm = require('../models/Alarm');
const { analyzeSensorData } = require('../services/analysisService');

router.post('/', protect, async (req, res) => {
  try {
    const { deviceId, accelerometer, location, gyroscope, batteryLevel } = req.body;
    const deviceQuery = { _id: deviceId };

    if (req.user.role !== 'admin') {
      deviceQuery.assignedUser = req.user._id;
    }

    const device = await Device.findOne(deviceQuery);

    if (!device) {
      return res.status(403).json({
        success: false,
        message: 'Bu cihaz için sensör verisi gönderme yetkiniz yok',
      });
    }
    if (accelerometer) {
      const magnitudeMs2 = Math.sqrt(
        accelerometer.x ** 2 +
        accelerometer.y ** 2 +
        accelerometer.z ** 2
      );

      accelerometer.magnitude = Math.abs(
        magnitudeMs2 - 9.81
      ) / 9.81;
    }

    const log = await SensorLog.create({
      deviceId, accelerometer, location, gyroscope, batteryLevel,
      timestamp: new Date()
    });

    await Device.findByIdAndUpdate(deviceId, { lastSeen: new Date() });

    const lastLogs = await SensorLog.find({ deviceId })
      .sort({ timestamp: -1 }).limit(10);

    console.log('MAGNITUDE:', accelerometer?.magnitude);
    const detectedAlarms = analyzeSensorData(
      {
        accelerometer,
        location,
        gyroscope,
        batteryLevel,
      },
      lastLogs
    );
    

console.log('Detected alarms:', detectedAlarms);

    const savedAlarms = [];
    for (const alarmData of detectedAlarms) {
      const alarm = await Alarm.create({
        deviceId,
        userId: req.user._id,
        ...alarmData
      });
      savedAlarms.push(alarm);
      req.app.get('io').emit('new-alarm', alarm);
    }

    req.app.get('io').to(`user_${req.user._id}`).emit('sensor-update', log);

    res.status(201).json({ 
      success: true, 
      log, 
      alarms: savedAlarms 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.post('/vision-violation', protect, async (req, res) => {
  try {
    const { deviceId, violationType, description } = req.body;

    const alarm = await Alarm.create({
      deviceId,
      userId: req.user._id,
      type: 'PPE_VIOLATION',
      severity: 'HIGH',
      description: 'Yapay Zeka Uyarisi: ' + description
    });

    req.app.get('io').emit('new-alarm', alarm);

    res.status(201).json({ success: true, alarm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/user-location/:userId', protect, async (req, res) => {
  try {
    const device = await Device.findOne({ assignedUser: req.params.userId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Cihaz bulunamadı' });
    }

    const sonLog = await SensorLog.findOne({
      deviceId: device._id,
      'location': { $exists: true, $ne: null }
    }).sort({ timestamp: -1 });

    if (!sonLog || !sonLog.location) {
      return res.status(404).json({ success: false, message: 'Konum verisi henüz yok' });
    }

    res.json({
      success: true,
      location: sonLog.location,
      lastSeen: sonLog.timestamp,
      deviceId: device._id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-location', protect, async (req, res) => {
  try {
    const device = await Device.findOne({ assignedUser: req.user._id });
    
    if (!device) {
      return res.status(404).json({ success: false, message: 'Cihaz bulunamadı' });
    }

    const sonLog = await SensorLog.findOne({
      deviceId: device._id,
      location: { $exists: true, $ne: null }
    }).sort({ timestamp: -1 });

    if (!sonLog?.location) {
      return res.status(404).json({ success: false, message: 'Konum verisi henüz yok' });
    }

    res.json({
      success: true,
      location: sonLog.location,
      lastSeen: sonLog.timestamp
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:deviceId', protect, async (req, res) => {
  try {
    const { limit = 50, from, to } = req.query;
    let query = { deviceId: req.params.deviceId };
    
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const logs = await SensorLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;