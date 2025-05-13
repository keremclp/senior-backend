const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('./user.controller');
const { authenticateUser } = require('../../middleware/authentication');

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const uploadImage = multer({ 
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// User profile routes
router.get('/profile', authenticateUser, userController.getUserProfile);
router.patch('/profile', authenticateUser, userController.updateUserProfile);
router.post('/profile/image', authenticateUser, uploadImage.single('image'), userController.uploadProfileImage);

module.exports = router;