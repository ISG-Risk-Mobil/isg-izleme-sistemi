const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ 
      name, email, 
      password: hashedPassword, 
      role, department 
    });

    const token = generateToken(user._id);
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
      return res.status(400).json({ success: false, message: 'Email ve sifre zorunludur' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Gecersiz email veya sifre' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Gecersiz email veya sifre' });
    }
    const token = generateToken(user._id);
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
 //EKLENDİ 
// Admin'in tüm kullanıcıları görmesini sağlayan rota
router.get('/users', protect, async (req, res) => {
  try {
    // Sadece admin veya yönetici rolüne sahip olanlar erişebilir
    if (req.user.role !== 'admin' && req.user.role !== 'yönetici') {
      return res.status(403).json({ success: false, message: 'Bu alana erişim yetkiniz yok' });
    }

    // Veritabanındaki tüm kullanıcıları çek (şifreleri hariç tutmak için select('-password') kullanabilirsiniz)
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Kullanıcılar getirilemedi: ' + err.message });
  }
});

module.exports = router;