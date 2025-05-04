const matchingService = require('./matching.service');
const { StatusCodes } = require('http-status-codes');

const getAdvisorMatches = async (req, res) => {
  const { resumeId }  = req.query;
  const userId = req.user.userId;
  
  const matchResults = await matchingService.findMatchingAdvisors(resumeId, userId);
  
  res.status(StatusCodes.OK).json({
    message: 'Advisor matches found successfully',
    data: matchResults
  });
};

module.exports = {
  getAdvisorMatches
};