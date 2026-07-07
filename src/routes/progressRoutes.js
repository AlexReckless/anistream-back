//progressRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProgress,
  markEpisodeAsWatched,
  isEpisodeWatched,
  getPoints,
  addPoints,
  subtractPoints,
  addCharacterToCollection,
  getCharacterCollection,
  getTransactions,
  syncProgress
} = require('../controllers/progressController');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', getProgress);
router.get('/points', getPoints);
router.get('/characters', getCharacterCollection);
router.get('/transactions', getTransactions);
router.get('/is-watched/:animeId/:episodeNumber', isEpisodeWatched);

router.post('/watch-episode', markEpisodeAsWatched);
router.post('/add-points', addPoints);
router.post('/subtract-points', subtractPoints);
router.post('/add-character', addCharacterToCollection);
router.post('/sync', syncProgress);

module.exports = router;