//authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getSecurityQuestions,
  verifySecurityAnswers,
  resetPassword,
  getProfile,
  updateProfile,
  getUserProfileById
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/get-security-questions', getSecurityQuestions);
router.post('/verify-security-answers', verifySecurityAnswers);
router.post('/reset-password', resetPassword);

// Rutas protegidas
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.get('/profile/:userId', protect, getUserProfileById);

module.exports = router;