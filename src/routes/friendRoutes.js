const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

// Buscar usuarios por nombre
router.get('/search', protect, friendController.searchUsers);

// Obtener solicitudes pendientes recibidas
router.get('/requests/pending', protect, friendController.getPendingRequests);

// Enviar solicitud de amistad
router.post('/request', protect, friendController.sendRequest);

// Aceptar solicitud de amistad
router.patch('/request/:requestId', protect, friendController.acceptRequest);

// Obtener amigos con sus rachas
router.get('/', protect, friendController.getFriendsWithStreaks);

module.exports = router;
