const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  source: { type: String, required: true },
  mangaId: { type: String, required: true },
  slug: { type: String, required: true },
  title: { type: String, required: true },
  cover: String,
  addedAt: { type: Date, default: Date.now }
});

const readChapterSchema = new mongoose.Schema({
  source: { type: String, required: true },
  mangaId: { type: String, required: true },
  slug: String,
  title: String,
  cover: String,
  chapterId: { type: String, required: true },
  chapterNumber: Number,
  readAt: { type: Date, default: Date.now }
});

const mangaProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  favorites: [favoriteSchema],
  readChapters: [readChapterSchema]
});

mangaProgressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('MangaProgress', mangaProgressSchema);
