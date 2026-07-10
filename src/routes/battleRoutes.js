const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createBattle,
  getIncomingBattles,
  getOutgoingBattles,
  rollBattle,
  getPenaltyOptions,
  applyPenalty
} = require('../controllers/battleController');

router.use(protect);

router.post('/', createBattle);
router.get('/incoming', getIncomingBattles);
router.get('/outgoing', getOutgoingBattles);
router.patch('/:id/roll', rollBattle);
router.get('/:id/penalty-options', getPenaltyOptions);
router.patch('/:id/penalty', applyPenalty);

module.exports = router;
