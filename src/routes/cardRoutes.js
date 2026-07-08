const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyCards, getFriendCards } = require('../controllers/cardController');

router.use(protect);

router.get('/mine', getMyCards);
router.get('/friend/:friendId', getFriendCards);

module.exports = router;
