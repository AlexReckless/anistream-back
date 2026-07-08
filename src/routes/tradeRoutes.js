const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTrade,
  getIncomingTrades,
  getOutgoingTrades,
  acceptTrade,
  rejectTrade,
  cancelTrade
} = require('../controllers/tradeController');

router.use(protect);

router.post('/', createTrade);
router.get('/incoming', getIncomingTrades);
router.get('/outgoing', getOutgoingTrades);
router.patch('/:id/accept', acceptTrade);
router.patch('/:id/reject', rejectTrade);
router.patch('/:id/cancel', cancelTrade);

module.exports = router;
