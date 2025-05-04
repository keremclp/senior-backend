const express = require('express');
const matchingController = require('./matching.controller');
const { authenticateUser } = require('../../middleware/authentication');

const router = express.Router();

// Get advisor matches for a resume
router.get('/resume', authenticateUser, matchingController.getAdvisorMatches);

module.exports = router;