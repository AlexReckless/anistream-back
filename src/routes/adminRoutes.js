const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getSettings, updateSettings, getUserPoints, setUserPoints } = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/users/:userId/points', getUserPoints);
router.post('/users/:userId/points', setUserPoints);

module.exports = router;
