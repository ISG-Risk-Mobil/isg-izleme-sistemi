/*
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const User = require('./models/User');
const Risk = require('./models/Risk');
const Alert = require('./models/Alert');
const Report = require('./models/Report');
const SensorData = require('./models/SensorData');
const Device = require('./models/Device');
const { analyzeSingle, analyzeTimeSeries } = require('./analysis'); 

const app = express();
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI) 
  .then(() => console.log("✔ BAĞLANDI"))
  .catch(err => console.log("MONGO HATA:", err));

// JWT middleware 
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token yok' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'isg_super_gizli_anahtar_2024');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token geçersiz' });
  }
};

// Test 
app.get('/', (req, res) => {
  res.send('ISG Backend Çalışıyor');
});

// REGISTER 
app.post('/register',
  body('email').isEmail().withMessage('Geçerli bir email girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('fullName').notEmpty().withMessage('İsim boş olamaz'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { fullName, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email zaten kayıtlı" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ fullName, email, password: hashedPassword });
      await user.save();
      res.json({ message: "Kayıt başarılı" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// LOGIN 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı yok" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı" });
    const secret = process.env.JWT_SECRET || 'isg_super_gizli_anahtar_2024';
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      secret,
      { expiresIn: "1d" }
    );
    res.json({ message: "Giriş başarılı", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RISK EKLE
app.post('/risk', authMiddleware, async (req, res) => {
  try {
    const risk = new Risk({ ...req.body, userId: req.user.userId });
    await risk.save();
    res.json(risk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RISK LİSTELE 
app.get('/risk', authMiddleware, async (req, res) => {
  try {
    const risks = await Risk.find().populate('userId', 'fullName email');
    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ALERT EKLE 
app.post('/alert', authMiddleware, async (req, res) => {
  try {
    const { type, severity, message, location } = req.body;

    if (!type || !severity || !message) {
      return res.status(400).json({ message: 'type, severity ve message zorunludur' });
    }

    const alert = new Alert({ type, severity, message, location, userId: req.user.userId });
    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ALERT LİSTELE 
app.get('/alert', authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORT EKLE 
app.post('/report', authMiddleware, async (req, res) => {
  try {
    const report = new Report({ ...req.body, createdBy: req.user.userId });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORT LİSTELE 
app.get('/report', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().populate('createdBy', 'fullName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR VERİSİ EKLE + OTOMATİK ANALİZ 
app.post('/sensor', authMiddleware, async (req, res) => {
  try {
    const sensorData = new SensorData({ ...req.body, userId: req.user.userId });
    await sensorData.save();

    const risks = analyzeSingle(sensorData);

    for (const r of risks) {
      await new Alert({
        userId: req.user.userId,
        type: r.type,
        severity: r.level,
        message: r.message,
        location: { lat: r.latitude, lng: r.longitude }
      }).save();

      await new Risk({
        userId: req.user.userId,
        type: r.type,
        level: r.level,
        message: r.message,
        location: { lat: r.latitude, lng: r.longitude }
      }).save();
    }

    res.json({ sensorData, detectedRisks: risks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - KENDİ VERİLERİM 
app.get('/sensor/me', authMiddleware, async (req, res) => {
  try {
    const data = await SensorData.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - SON N KAYIT 
app.get('/sensor/recent', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await SensorData.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - ZARİF SERİSİ ANALİZİ 
app.get('/sensor/analyze', authMiddleware, async (req, res) => {
  try {
    const recentData = await SensorData.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    const risks = analyzeTimeSeries(recentData.reverse());
    res.json({ analyzed: recentData.length, detectedRisks: risks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - TÜM VERİLER 
app.get('/sensor', authMiddleware, async (req, res) => {
  try {
    const data = await SensorData.find().populate('userId', 'fullName email');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server ${process.env.PORT || 3000} portunda çalışıyor`);
});
*/

/*
const express = require('express');
const http = require('http'); // 1. HTTP modülü
const { Server } = require('socket.io'); // 2. Socket.io
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const User = require('./models/User');
const Risk = require('./models/Risk');
const Alert = require('./models/Alert');
const Report = require('./models/Report');
const SensorData = require('./models/SensorData');
const Device = require('./models/Device');
const { analyzeSingle, analyzeTimeSeries } = require('./analysis');

const app = express();
const server = http.createServer(app); // 3. HTTP sunucusu app üzerinden
const io = new Server(server, {        // 4. Socket.io başlat
  cors: { origin: "*" }
});

app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✔ BAĞLANDI"))
  .catch(err => console.log("MONGO HATA:", err));

// JWT middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token yok' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'isg_super_gizli_anahtar_2024');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token geçersiz' });
  }
};

// Socket bağlantısı logu
io.on('connection', (socket) => {
  console.log('Frontend Dashboard bağlandı:', socket.id);
});

// Test
app.get('/', (req, res) => {
  res.send('ISG Backend Çalışıyor');
});

// REGISTER 
app.post('/register',
  body('email').isEmail().withMessage('Geçerli bir email girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('fullName').notEmpty().withMessage('İsim boş olamaz'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { fullName, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email zaten kayıtlı" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ fullName, email, password: hashedPassword });
      await user.save();
      res.json({ message: "Kayıt başarılı" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// LOGIN 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı yok" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı" });
    const secret = process.env.JWT_SECRET || 'isg_super_gizli_anahtar_2024';
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      secret,
      { expiresIn: "1d" }
    );
    res.json({ message: "Giriş başarılı", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RISK EKLE 
app.post('/risk', authMiddleware, async (req, res) => {
  try {
    const risk = new Risk({ ...req.body, userId: req.user.userId });
    await risk.save();
    res.json(risk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RISK LİSTELE 
app.get('/risk', authMiddleware, async (req, res) => {
  try {
    const risks = await Risk.find().populate('userId', 'fullName email');
    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ALERT EKLE 
app.post('/alert', authMiddleware, async (req, res) => {
  try {
    const { type, severity, message, location } = req.body;

    if (!type || !severity || !message) {
      return res.status(400).json({ message: 'type, severity ve message zorunludur' });
    }

    const alert = new Alert({ type, severity, message, location, userId: req.user.userId });
    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ALERT LİSTELE 
app.get('/alert', authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORT EKLE 
app.post('/report', authMiddleware, async (req, res) => {
  try {
    const report = new Report({ ...req.body, createdBy: req.user.userId });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORT LİSTELE 
app.get('/report', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().populate('createdBy', 'fullName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR VERİSİ EKLE + OTOMATİK ANALİZ + SOCKET.IO YAYINI 
app.post('/sensor', authMiddleware, async (req, res) => {
  try {
    const sensorData = new SensorData({ ...req.body, userId: req.user.userId });
    await sensorData.save();

    const risks = analyzeSingle(sensorData);

    // Socket.io ile canlı yayın
    io.emit('sensorData', {
      riskCount: risks.length,
      personnelCount: 12, 
      status: risks.length > 0 ? "Kritik" : "Güvenli",
      lastSensorValue: sensorData.value
    });

    for (const r of risks) {
      await new Alert({
        userId: req.user.userId,
        type: r.type,
        severity: r.level,
        message: r.message,
        location: { lat: r.latitude, lng: r.longitude }
      }).save();

      await new Risk({
        userId: req.user.userId,
        type: r.type,
        level: r.level,
        message: r.message,
        location: { lat: r.latitude, lng: r.longitude }
      }).save();
    }

    res.json({ sensorData, detectedRisks: risks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - KENDİ VERİLERİM 
app.get('/sensor/me', authMiddleware, async (req, res) => {
  try {
    const data = await SensorData.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - SON N KAYIT 
app.get('/sensor/recent', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await SensorData.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - ZARİF SERİSİ ANALİZİ 
app.get('/sensor/analyze', authMiddleware, async (req, res) => {
  try {
    const recentData = await SensorData.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    const risks = analyzeTimeSeries(recentData.reverse());
    res.json({ analyzed: recentData.length, detectedRisks: risks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SENSOR - TÜM VERİLER 
app.get('/sensor', authMiddleware, async (req, res) => {
  try {
    const data = await SensorData.find().populate('userId', 'fullName email');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// app.listen yerine server.listen
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server ${process.env.PORT || 5000} portunda çalışıyor`);
});
*/
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const User = require('./models/User');
const Risk = require('./models/Risk');
const Alert = require('./models/Alert');
const Report = require('./models/Report');
const SensorData = require('./models/SensorData');
const Device = require('./models/Device');
const { analyzeSingle, analyzeTimeSeries } = require('./analysis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✔ BAĞLANDI"))
  .catch(err => console.log("MONGO HATA:", err));

// JWT middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token yok' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'isg_super_gizli_anahtar_2024');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token geçersiz' });
  }
};

// Admin kontrol middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yetkisiz: Sadece adminler erişebilir' });
  }
  next();
};

// Socket bağlantısı logu
io.on('connection', (socket) => {
  console.log('Frontend Dashboard bağlandı:', socket.id);
});

// Test
app.get('/', (req, res) => {
  res.send('ISG Backend Çalışıyor');
});

/* REGISTER — kayıt olan herkes otomatik worker olur */
app.post('/register',
  body('email').isEmail().withMessage('Geçerli bir email girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('fullName').notEmpty().withMessage('İsim boş olamaz'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { fullName, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email zaten kayıtlı" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      // role gönderilse bile yok sayılır, model default'u "worker" kullanır
      const user = new User({ name: fullName, email, password: hashedPassword });
      await user.save();
      res.json({ message: "Kayıt başarılı" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

/* LOGIN */
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı yok" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı" });
    const secret = process.env.JWT_SECRET || 'isg_super_gizli_anahtar_2024';
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      secret,
      { expiresIn: "1d" }
    );
    res.json({ message: "Giriş başarılı", token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* KULLANICI LİSTESİ — sadece admin görebilir */
app.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* KULLANICIYA ADMİN YETKİSİ VER — sadece admin yapabilir */
app.put('/users/:id/make-admin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json({ message: `${user.fullName} artık admin`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* KULLANICIDAN ADMİN YETKİSİ AL — sadece admin yapabilir */
app.put('/users/:id/make-worker', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'worker' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json({ message: `${user.fullName} artık worker`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* RISK EKLE */
app.post('/risk', authMiddleware, async (req, res) => {
  try {
    const risk = new Risk({ ...req.body, userId: req.user.userId });
    await risk.save();
    res.json(risk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* RISK LİSTELE */
app.get('/risk', authMiddleware, async (req, res) => {
  try {
    const risks = await Risk.find().populate('userId', 'fullName email');
    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ALERT EKLE */
app.post('/alert', authMiddleware, async (req, res) => {
  try {
    const { type, severity, message, location } = req.body;
    if (!type || !severity || !message) {
      return res.status(400).json({ message: 'type, severity ve message zorunludur' });
    }
    const alert = new Alert({ type, severity, message, location, userId: req.user.userId });
    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ALERT LİSTELE */
app.get('/alert', authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* REPORT EKLE */
app.post('/report', authMiddleware, async (req, res) => {
  try {
    const report = new Report({ ...req.body, createdBy: req.user.userId });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* REPORT LİSTELE */
app.get('/report', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().populate('createdBy', 'fullName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SENSOR VERİSİ EKLE + OTOMATİK ANALİZ + SOCKET.IO YAYINI */
app.post('/sensor', authMiddleware, async (req, res) => {
  try {
    const sensorData = new SensorData({ ...req.body, userId: req.user.userId });
    await sensorData.save();

    const risks = analyzeSingle(sensorData);

    io.emit('sensorData', {
      riskCount: risks.length,
      personnelCount: 12,
      status: risks.length > 0 ? "Kritik" : "Güvenli",
      lastSensorValue: sensorData.value
    });

    for (const r of risks) {
      await new Alert({
        userId: req.user.userId,
        type: r.type,
        severity: r.level,
        message: r.message,
        location: { lat: r.latitude, lng: r.longitude }
      }).save();

      await new Risk({
        userId: req.user.userId,
        type: r.type,
        level: r.level,
        message: r.message,
        location: { lat: r.latitude, lng: r.longitude }
      }).save();
    }

    res.json({ sensorData, detectedRisks: risks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SENSOR - KENDİ VERİLERİM */
app.get('/sensor/me', authMiddleware, async (req, res) => {
  try {
    const data = await SensorData.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SENSOR - SON N KAYIT */
app.get('/sensor/recent', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await SensorData.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SENSOR - ZARİF SERİSİ ANALİZİ */
app.get('/sensor/analyze', authMiddleware, async (req, res) => {
  try {
    const recentData = await SensorData.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    const risks = analyzeTimeSeries(recentData.reverse());
    res.json({ analyzed: recentData.length, detectedRisks: risks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SENSOR - TÜM VERİLER */
app.get('/sensor', authMiddleware, async (req, res) => {
  try {
    const data = await SensorData.find().populate('userId', 'fullName email');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server ${process.env.PORT || 5000} portunda çalışıyor`);
});
