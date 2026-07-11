const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getBanner, getBannerVersion, upsertSlot, deleteSlot } = require('../controllers/bannerController');

// Cualquier usuario logueado puede leer el banner (es lo que ve Home).
router.get('/', protect, getBanner);
// Chequeo liviano (solo fecha, sin imágenes) para saber si conviene pedir
// el banner completo o si la copia en caché del cliente ya está al día.
router.get('/version', protect, getBannerVersion);

// Solo el admin puede editarlo.
router.put('/slots/:order', protect, requireAdmin, upsertSlot);
router.delete('/slots/:order', protect, requireAdmin, deleteSlot);

module.exports = router;
