const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Şifre hashlenmiş olarak saklanır
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // Kullanıcı rolü: admin veya saha çalışanı
  role: {
    type: String,
    enum: ['admin', 'worker'],
    default: 'worker'
  },
  department: { type: String, trim: true }, 
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);