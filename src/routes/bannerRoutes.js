const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getBanner, upsertSlot, deleteSlot } = require('../controllers/bannerController');

// Cualquier usuario logueado puede leer el banner (es lo que ve Home).
router.get('/', protect, getBanner);

// Solo el admin puede editarlo.
router.put('/slots/:order', protect, requireAdmin, upsertSlot);
router.delete('/slots/:order', protect, requireAdmin, deleteSlot);

module.exports = router;
