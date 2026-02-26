// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();


const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/auth.controller');  

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', login);
router.get('/me', authMiddleware, getMe); // authMiddleware là middleware check token
module.exports = router;