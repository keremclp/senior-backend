const express = require('express');
const multer = require('multer');
const uploadController = require('./upload.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage

router.post('/', upload.single('file'), uploadController.uploadFile);

module.exports = router;
