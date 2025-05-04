const matchingRepository = require('./matching.repository');
const { analyzeResume, matchAdvisorsWithResume } = require('../../utils/openai');
const CustomError = require('../../errors');

/**
 * Process a resume and find matching advisors
 * @param {string} resumeId - The ID of the resume to process
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Matching results
 */
const findMatchingAdvisors = async (resumeId, userId) => {
  // Get the resume
  const resume = await matchingRepository.getResumeById(resumeId);
  console.log(resume);
  
  if (!resume) {
    throw new CustomError.NotFoundError('Resume not found');
  }
  
  // Check if the resume belongs to the user
  if (resume.user.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to access this resume');
  }
  
  // Analyze the resume using OpenAI
  const resumeAnalysis = await analyzeResume(resume.fileUrl);
  
  // Match the resume analysis with relevant fields
  const matchingFields = await matchAdvisorsWithResume(resumeAnalysis);

  console.log('Matching fields:', matchingFields);
  
  // Find advisors with matching fields
  const advisors = await matchingRepository.findAdvisorsByFields(matchingFields.fields);
  // Calculate match scores for each advisor
  const matchingAdvisors = advisors.map(advisor => {
    // Calculate how many tags match with the relevant fields
    const matchingTags = advisor.tags.filter(tag => 
      matchingFields.includes(tag)
    );

    console.log('Matching tags:', matchingTags);
    
    const score = (matchingTags.length / matchingFields.length) * 100;
    console.log('Match score:', score);
    return {
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        info: advisor.info,
        secondInfo: advisor.secondInfo,
        prefix: advisor.prefix,
        tags: advisor.tags
      },
      matchScore: Math.round(score),
      matchingAreas: matchingTags
    };
  });
  
  // Sort advisors by match score (highest first)
  matchingAdvisors.sort((a, b) => b.matchScore - a.matchScore);
  
  // Save match results
  await matchingRepository.saveMatchResults(resumeId, userId, matchingAdvisors);
  
  return {
    resumeTitle: resume.title,
    analysisResults: resumeAnalysis,
    matchingAdvisors
  };
};

module.exports = {
  findMatchingAdvisors
};