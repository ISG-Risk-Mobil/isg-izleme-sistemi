const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Device = require('../models/Device');
const { protect } = require('../middleware/auth');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Yetkisiz: Sadece adminler erişebilir' });
  }
  next();
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name, email,
      password: hashedPassword,
      role: 'worker',
      department
    });
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }
    const token = generateToken(user._id, user.role);
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id/make-admin', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    res.json({ success: true, message: `${user.name} artık admin`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id/make-worker', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'worker' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    res.json({ success: true, message: `${user.name} artık worker`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Bu email kayıtlı değil' });
    }
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ success: true, resetToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token ve yeni şifre zorunludur' });
    }
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ success: true, message: 'Şifre sıfırlandı' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Token süresi doldu' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Eski ve yeni şifre zorunludur' });
    }
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Eski şifre hatalı' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ success: true, message: 'Şifre güncellendi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/devices', protect, async (req, res) => {
  try {
    const devices = await Device.find().populate('assignedUser', 'name email');
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/alerts', protect, async (req, res) => {
  try {
    const Alarm = require('../models/Alarm');
    const sadecKendi = req.query.kendi === 'true';
    const query = (req.user.role !== 'admin' || sadecKendi)
      ? { userId: req.user._id }
      : {};
    const alerts = await Alarm.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-sensor', protect, async (req, res) => {
  try {
    const Device = require('../models/Device');
    const SensorLog = require('../models/SensorLog');
    const Alarm = require('../models/Alarm');

    
    let device = await Device.findOne({ assignedUser: req.user._id });

    if (!device) {
      const lastAlarm = await Alarm.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (lastAlarm) {
        device = await Device.findById(lastAlarm.deviceId);
      }
    }

    if (!device) return res.json({ success: true, logs: [] });

    const logs = await SensorLog.find({ deviceId: device._id })
      .sort({ timestamp: -1 })
       

    res.json({ success: true, logs: logs.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/alarms/:id/resolve', async (req, res) => {

  const alarm = await Alarm.findByIdAndUpdate(
    req.params.id,
    {
      resolved: true
    },
    {
      new: true
    }
  );

  res.json({
    success: true,
    alarm
  });

});

router.get('/my-location', protect, async (req, res) => {
  try {
    
    const SensorLog = require('../models/SensorLog');
    const sonKonumLogu = await SensorLog.findOne({ userId: req.user._id })
                                        .sort({ timestamp: -1 });

    if (!sonKonumLogu || !sonKonumLogu.location) {
      return res.json({ success: false, message: "Konum kaydı bulunamadı." });
    }

    res.json({ 
      success: true, 
      location: {
        lat: sonKonumLogu.location.lat,
        lng: sonKonumLogu.location.lng
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;