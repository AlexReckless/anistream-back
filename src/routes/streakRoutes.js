const express = require('express');
const router = express.Router();
const streakController = require('../controllers/streakController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Iniciar una racha
router.post('/start', streakController.startStreak);

// Actualizar progreso de racha
router.patch('/progress', streakController.updateStreakProgress);

// Obtener rachas activas
router.get('/active', streakController.getMyStreaks);

// Obtener rachas completadas
router.get('/completed', streakController.getCompletedStreaks);

module.exports = router;