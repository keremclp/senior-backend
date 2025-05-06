const express = require('express');
const matchingController = require('./matching.controller');
const { authenticateUser } = require('../../middleware/authentication');

const router = express.Router();

// Get advisor matches for a resume
router.get('/resume', authenticateUser, matchingController.getAdvisorMatches);

// Get match results for a resume
router.get('/results', authenticateUser, matchingController.getMatchResults);

module.exports = router;