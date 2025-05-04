const Advisor = require('../../models/advisor.model');
const Resume = require('../../models/resume.model');

const insertAdvisors = async (data) => {
  return await Advisor.insertMany(data);
};

const createResume = async (resumeData) => {
  return await Resume.create(resumeData);
};

const getResumesByUser = async (userId) => {
  return await Resume.find({ user: userId });
};

const getResumeById = async (id) => {
  return await Resume.findById(id);
};

const deleteResume = async (id) => {
  return await Resume.findByIdAndDelete(id);
};

module.exports = {
  insertAdvisors,
  createResume,
  getResumesByUser,
  getResumeById,
  deleteResume
};
