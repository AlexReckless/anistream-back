const mongoose = require('mongoose');

// Instancia individual de una carta poseida por un usuario.
// Reemplaza como fuente de verdad al Map characterCollection de UserProgress,
// que solo soporta una copia por personaje y no permite transferir dueño.
const cardSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  characterId: { type: String, required: true },
  characterName: { type: String, required: true },
  image: String,
  anime: String,
  rarity: { type: String, required: true },
  favorites: Number,
  synopsis: String,
  source: String,
  isOriginal: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  obtainedAt: { type: Date, default: Date.now }
});

cardSchema.index({ ownerId: 1, obtainedAt: -1 });

module.exports = mongoose.model('Card', cardSchema);
