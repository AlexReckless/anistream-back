const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Publicar comentario (requiere autenticación)
router.post('/', protect, commentController.addComment);

// Obtener comentarios de un episodio (sin autenticación)
router.get('/:animeId/:episodeNumber', commentController.getComments);

module.exports = router;
