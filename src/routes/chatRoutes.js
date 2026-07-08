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
  togglePinMessage,
  updateSummary,
  deleteMessage,
} = require('../controllers/chatController');

router.use(protect);

router.get('/list',                   listChats);
router.get('/conversation/:characterId', getConversation);
router.post('/init',                  initChat);
router.post('/message',               sendMessage);
router.post('/save',                  saveConversation);
router.delete('/clear/:characterId',  clearConversation);
router.patch('/update-image',         updateCharacterImage);
router.patch('/rate',                 rateCharacter);
router.patch('/pin-message',          togglePinMessage);
router.patch('/summarize',            updateSummary);
router.delete('/message/:characterId/:messageId', deleteMessage);
router.get('/:characterId',           getOrCreateChat);

module.exports = router;