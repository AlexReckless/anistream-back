// mangaRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFavorites,
  toggleFavorite,
  getHistory,
  markChapterRead,
  getReadChapters
} = require('../controllers/mangaController');

router.use(protect);

router.get('/favorites', getFavorites);
router.post('/favorites', toggleFavorite);
router.get('/history', getHistory);
router.post('/read', markChapterRead);
router.get('/read/:source/:mangaId', getReadChapters);

module.exports = router;
