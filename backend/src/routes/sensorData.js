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

    if (accelerometer) {
      accelerometer.magnitude = Math.sqrt(
        accelerometer.x**2 + accelerometer.y**2 + accelerometer.z**2
      );
    }

    const log = await SensorLog.create({
      deviceId, accelerometer, location, gyroscope, batteryLevel,
      timestamp: new Date()
    });

    await Device.findByIdAndUpdate(deviceId, { lastSeen: new Date() });

    const lastLogs = await SensorLog.find({ deviceId })
      .sort({ timestamp: -1 }).limit(10);

    const detectedAlarms = analyzeSensorData(req.body, lastLogs);

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

    req.app.get('io').emit('sensor-update', log);

    res.status(201).json({ 
      success: true, 
      log, 
      alarms: savedAlarms 
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

module.exports = router;