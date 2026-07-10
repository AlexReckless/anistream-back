const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  challengerRoll: { type: Number, required: true },
  opponentRoll: Number,
  status: {
    type: String,
    // 'pending_penalty': el retador perdió y el retado debe elegir, de la
    // coleccion del retador, la carta que se lleva como penalización.
    enum: ['pending', 'pending_penalty', 'completed'],
    default: 'pending'
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Carta que pierde el retador cuando pierde el combate (distinta de
  // "card", que es la carta del retado por la que se combatió).
  penaltyCard: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

battleSchema.index({ opponent: 1, status: 1 });
battleSchema.index({ challenger: 1, status: 1 });

module.exports = mongoose.model('Battle', battleSchema);
