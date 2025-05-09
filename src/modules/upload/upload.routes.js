const express = require('express');
const multer = require('multer');
const uploadController = require('./upload.controller');
const { authenticateUser } = require('../../middleware/authentication');

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter for resumes
const resumeFilter = (req, file, cb) => {
  // Accept pdf and doc/docx files only
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed!'), false);
  }
};

// Multer setup for different file types
const uploadExcel = multer({ dest: 'uploads/' });
const uploadResume = multer({ 
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Admin routes for Excel imports
router.post('/', uploadExcel.single('file'), uploadController.uploadFile);
router.post('/update-universities', uploadExcel.single('file'), uploadController.updateAdvisorsUniversity);

// Resume routes for users
router.post('/resume', authenticateUser, uploadResume.single('resume'), uploadController.uploadResume);
// get single resume
router.get('/resume', authenticateUser, uploadController.getResume);
router.get('/resumes', authenticateUser, uploadController.getUserResumes);
router.post('/delete-resume', authenticateUser, uploadController.deleteResume);

module.exports = router;
