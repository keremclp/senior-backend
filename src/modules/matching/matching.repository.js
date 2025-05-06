const Advisor = require('../../models/advisor.model');
const Resume = require('../../models/resume.model');
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
    id: advisor._id,
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
 * @param {Array} advisors - Array of matching advisor IDs with scores
 */
const saveMatchResults = async (resumeId, userId, advisors) => {
  // This would ideally be implemented with a new Match model
  // For now, we'll return the data that would be saved
  return {
    resumeId,
    userId,
    advisors,
    timestamp: new Date()
  };
};

module.exports = {
  getResumeById,
  findAdvisorsByFields,
  saveMatchResults
};