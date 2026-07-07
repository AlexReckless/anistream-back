const mongoose = require('mongoose');

const episodeCommentSchema = new mongoose.Schema({
  animeId: {
    type: String,
    required: true,
    index: true
  },
  episodeNumber: {
    type: Number,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para buscar comentarios de un capítulo específico rápidamente
episodeCommentSchema.index({ animeId: 1, episodeNumber: 1, createdAt: -1 });

module.exports = mongoose.model('EpisodeComment', episodeCommentSchema);