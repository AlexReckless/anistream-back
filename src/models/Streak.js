const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  // Los dos usuarios involucrados en la racha
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Anime de la racha
  animeId: { type: String, required: true },
  animeTitle: { type: String, required: true },
  animeImage: { type: String, default: '' },
  totalEpisodes: { type: Number, default: 0 },
  episodesWatched: { type: Number, default: 0 },
  
  // Estado de la racha
  status: {
    type: String,
    enum: ['active', 'completed', 'broken'],
    default: 'active'
  },
  
  // Rachas
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastProgressDate: { type: Date, default: null },
  
  // Fechas
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  brokenAt: { type: Date, default: null }
});

// Índices
streakSchema.index({ users: 1, status: 1 });
streakSchema.index({ 'users': 1, 'animeId': 1, 'status': 1 });

module.exports = mongoose.model('Streak', streakSchema);