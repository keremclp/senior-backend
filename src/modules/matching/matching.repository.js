const Advisor = require('../../models/advisor.model');
const Resume = require('../../models/resume.model');
const Match = require('../../models/match.model');
const mongoose = require('mongoose');

/**
 * Get resume by ID
 * @param {string} resumeId - The resume ID
 */
const getResumeById = async (resumeId) => {
  return await Resume.findById(resumeId);
};

/**
 * Find advisors by matching fields
 * @param {Array} fields - Array of fields to match
 * @param {Number} limit - Maximum number of advisors to return
 */
const findAdvisorsByFields = async (fields) => {  
  const advisors = await Advisor.find({
    tags: { $in: fields }
  });
  
  return advisors.map(advisor => ({
    _id: advisor._id,
    name: advisor.name,
    email: advisor.email,
    info: advisor.info,
    secondInfo: advisor.secondInfo,
    prefix: advisor.prefix,
    tags: advisor.tags,
    university: advisor.university,
  })); 
};

/**
 * Save match results to the database
 * @param {string} resumeId - The resume ID
 * @param {string} userId - The user ID
 * @param {Array} advisors - Array of matching advisor objects with scores
 * @returns {Promise<Object>} - The saved match document
 */
const saveMatchResults = async (resumeId, userId, advisors) => {
  // Transform advisors array to match the schema structure
  const formattedAdvisors = advisors.map(formattedAdvisor => {
    // Ensure we have a valid advisor ID
    const advisorId = formattedAdvisor.advisor.id || formattedAdvisor.advisor._id;
    
    if (!advisorId) {
      console.error('Missing advisor ID:', formattedAdvisor);
      return null; // Will be filtered out below
    }
    
    return {
      advisor: advisorId, // Use the advisor ID as reference
      matchScore: formattedAdvisor.matchScore || formattedAdvisor.score || 0,
      matchingAreas: formattedAdvisor.matchingAreas || formattedAdvisor.tags || []
    };
  }).filter(item => item !== null); // Remove any null entries
  
  // Check if we have any valid advisors left
  if (formattedAdvisors.length === 0) {
    throw new Error('No valid advisors provided. Each advisor must have an id or _id field.');
  }

  const matchData = {
    resumeId,
    userId,
    advisors: formattedAdvisors
  };

  const match = await Match.create(matchData);
  return match;
};

async function getMatchResults(resumeId, userId) {
  const match = await Match.findOne({ resumeId, userId }).populate('advisors.advisor');
  return match;
}

async function deleteMatchResults(resumeId, userId) {
  const result = await Match.deleteMany({ resumeId, userId });
  if (result.deletedCount === 0) {
    throw new Error('No match results found to delete');
  }
  return result;
}

module.exports = {
  getResumeById,
  findAdvisorsByFields,
  saveMatchResults,
  getMatchResults,
  deleteMatchResults
};