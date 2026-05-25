const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  details: String,
  // Raporu oluşturan kullanıcı
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Raporun bağlı olduğu alarm (isteğe bağlı)
  relatedAlert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  // Raporun bağlı olduğu risk (isteğe bağlı)
  relatedRisk: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Risk'
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);  