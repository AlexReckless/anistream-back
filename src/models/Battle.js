const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  challengerRoll: { type: Number, required: true },
  opponentRoll: Number,
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

battleSchema.index({ opponent: 1, status: 1 });
battleSchema.index({ challenger: 1, status: 1 });

module.exports = mongoose.model('Battle', battleSchema);
