const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getMyCards, getFriendCards, cloneCard, giftOwnCard } = require('../controllers/cardController');

router.use(protect);

router.get('/mine', getMyCards);
router.get('/friend/:friendId', getFriendCards);
router.post('/:cardId/clone', requireAdmin, cloneCard);
router.post('/:cardId/gift', requireAdmin, giftOwnCard);

module.exports = router;
