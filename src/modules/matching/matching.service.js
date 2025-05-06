const matchingRepository = require('./matching.repository');
const { analyzeResume, matchingFieldsFromResume } = require('../../utils/openai');
const CustomError = require('../../errors');
const UNIVERSITIES = require('../../common/enums/university-names.enum');
const ENGINEERING_DISCIPLINES = require('../../common/enums/second-info.enum');

/**
 * Process a resume and find matching advisors
 * @param {string} resumeId - The ID of the resume to process
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Matching results
 */
const findMatchingAdvisors = async (resumeId, userId) => {
  // Get the resume
  const resume = await matchingRepository.getResumeById(resumeId);
  console.log('Resume:', resume);
  
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
  const matchingFields = await matchingFieldsFromResume(resumeAnalysis);

  console.log('Matching fields:', matchingFields.fields);
  // Find advisors with matching fields
  const advisors = await matchingRepository.findAdvisorsByFields(matchingFields.fields);
  
  // Get the display name of the university using the enum value
  const universityDisplayName = UNIVERSITIES[resume.university] || resume.university;
  const secondInfoDisplayName = ENGINEERING_DISCIPLINES[resume.engineeringField] || resume.engineeringField;

  // Filter the advisors based on the university and secondInfo
  const filteredAdvisors = advisors.filter(advisor => {
    // More defensive comparison
    const universityMatches = advisor.university === universityDisplayName;
    const fieldMatches = advisor.secondInfo === secondInfoDisplayName;    
    return universityMatches && fieldMatches;
  });

  // Calculate match scores for each advisor
  const matchingAdvisors = filteredAdvisors.map(filteredAdvisor => {
    // Calculate how many tags match with the relevant fields
    const matchingTags = filteredAdvisor.tags.filter(tag => 
      matchingFields.fields.includes(tag)
    );

    const score = (matchingTags.length / filteredAdvisor.tags.length) * 100;
    return {
      advisor: {
        id: filteredAdvisor.id,
        name: filteredAdvisor.name,
        email: filteredAdvisor.email,
        info: filteredAdvisor.info,
        secondInfo: filteredAdvisor.secondInfo,
        prefix: filteredAdvisor.prefix,
        tags: filteredAdvisor.tags
      },
      matchScore: Math.round(score),
      matchingAreas: matchingTags
    };
  });

  // Sort advisors by match score (highest first)
  matchingAdvisors.sort((a, b) => b.matchScore - a.matchScore);

  console.log('Matching advisors:', matchingAdvisors);

  // TODO: Save match results
  // await matchingRepository.saveMatchResults(resumeId, userId, matchingAdvisors);
  
  return {
    resumeTitle: resume.title,
    analysisResults: resumeAnalysis,
    matchingAdvisors
  };
};

module.exports = {
  findMatchingAdvisors
};