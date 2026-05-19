const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Alarm = require('../models/Alarm');

router.get('/', protect, async (req, res) => {
  try {
    const { resolved, severity, type } = req.query;
    let query = {};
    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const alarms = await Alarm.find(query)
      .populate('deviceId', 'name deviceId')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: alarms.length, alarms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const alarm = await Alarm.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );
    if (!alarm) {
      return res.status(404).json({ success: false, message: 'Alarm bulunamadı' });
    }
    res.json({ success: true, alarm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;