//Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'spend'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ['watch_episode', 'daily_bonus', 'purchase_character', 'gacha', 'other'],
    required: true
  },
  metadata: {
    animeId: String,
    episodeNumber: Number,
    characterId: String,
    characterName: String,
    gachaResult: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas eficientes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ createdAt: -1 });

// Método estático para obtener resumen
transactionSchema.statics.getSummary = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { 
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const summary = {
    totalEarned: 0,
    totalSpent: 0,
    transactionCount: 0
  };
  
  result.forEach(r => {
    if (r._id === 'earn') {
      summary.totalEarned = r.total;
      summary.earnCount = r.count;
    } else if (r._id === 'spend') {
      summary.totalSpent = r.total;
      summary.spendCount = r.count;
    }
    summary.transactionCount += r.count;
  });
  
  return summary;
};

module.exports = mongoose.model('Transaction', transactionSchema);
transactionSchema.on('index', (error) => {
    if (error) console.error('Error creando índice en Transaction:', error);
});