const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticateUser } = require('../../middleware/authentication');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticateUser, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
