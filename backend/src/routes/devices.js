const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Device = require('../models/Device');

router.get('/', protect, async (req, res) => {
  try {
    const query = {};

    if (req.user.role !== 'admin') {
      query.assignedUser = req.user._id;
    }

    const devices = await Device.find(query)
      .populate('assignedUser', 'name email department');

    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register', protect, adminOnly, async (req, res) => {
  try {
    const { deviceId, name, assignedUser } = req.body;
    const device = await Device.create({ deviceId, name, assignedUser });
    res.status(201).json({ success: true, device });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;