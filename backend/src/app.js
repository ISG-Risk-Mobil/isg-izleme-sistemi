const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/sensor-data', require('./routes/sensorData'));
app.use('/api/alarms', require('./routes/alarms'));
app.use('/api/devices', require('./routes/devices'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Kullanıcı ${userId} kendi room'una katıldı`);
  });
});

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  .then(() => {
    console.log('MongoDB bağlandı');
    server.listen(process.env.PORT, () => {
      console.log(`Sunucu ${process.env.PORT} portunda çalışıyor`);
    });
  })
  .catch(err => console.error('MongoDB bağlantı hatası:', err));