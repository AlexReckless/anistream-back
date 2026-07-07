//chatRoutes.js 
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOrCreateChat,
  getConversation,
  initChat,
  sendMessage,
  saveConversation,
  clearConversation,
  updateCharacterImage,
  rateCharacter,
  listChats,
} = require('../controllers/chatController');

router.use(protect);

router.get('/list',                   listChats);
router.get('/:characterId',           getOrCreateChat);
router.get('/conversation/:characterId', getConversation);
router.post('/init',                  initChat);
router.post('/message',               sendMessage);
router.post('/save',                  saveConversation);
router.delete('/clear/:characterId',  clearConversation);
router.patch('/update-image',         updateCharacterImage);
router.patch('/rate',                 rateCharacter);

module.exports = router;