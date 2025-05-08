const xlsx = require('xlsx');
const uploadRepository = require('./upload.repository');
const { uploadFileToS3, deleteFileFromS3 } = require('../../utils');
const CustomError = require('../../errors');
const matchingRepository = require('../matching/matching.repository');

const processExcelFile = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  return await uploadRepository.insertAdvisors(data);
};

const updateAdvisorsUniversity = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  // Ensure data contains the needed fields
  if (!data.length || !data[0].hasOwnProperty('email') || !data[0].hasOwnProperty('university')) {
    throw new CustomError.BadRequestError('Excel file must contain email and university columns');
  }
  
  // Map data to only include email and university fields
  const advisorUpdates = data.map(row => ({
    email: row.email,
    university: row.university
  }));
  
  const result = await uploadRepository.updateAdvisorsWithUniversity(advisorUpdates);
  return result;
};

const uploadResume = async (file, userId, title, university, engineeringField) => {
  if (!file) {
    throw new CustomError.BadRequestError('No file uploaded');
  }
  
  if (!university) {
    throw new CustomError.BadRequestError('University is required');
  }
  
  if (!engineeringField) {
    throw new CustomError.BadRequestError('Engineering field is required');
  }
  
  // Check file type
  if (!file.mimetype.includes('pdf') && !file.mimetype.includes('word')) {
    throw new CustomError.BadRequestError('Only PDF and Word documents are allowed');
  }
  
  try {
    // Upload file to S3
    const fileUrl = await uploadFileToS3(file, 'resumes');
    
    // Create resume record in database
    const resumeData = {
      title: title || file.originalname,
      fileUrl,
      fileType: file.mimetype,
      university,
      engineeringField,
      user: userId
    };
    
    const resume = await uploadRepository.createResume(resumeData);
    return resume;
  } catch (error) {
    throw new CustomError.BadRequestError(`Resume upload failed: ${error.message}`);
  }
};

const getUserResumes = async (userId) => {
  return await uploadRepository.getResumesByUser(userId);
};

const deleteUserResume = async (resumeId, userId) => {
  const resume = await uploadRepository.getResumeById(resumeId);
  
  if (!resume) {
    throw new CustomError.NotFoundError('Resume not found');
  }
  
  // Check if the resume belongs to the user
  if (resume.user.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to access this resume');
  }
  
  // Delete file from S3
  await deleteFileFromS3(resume.fileUrl);

  // delete matching results from the database
  // we need to get matching results for this resumeId and userId
  // and delete them from the database
  const matchingResults = await matchingRepository.getMatchResults(resumeId, userId);
  
  if (matchingResults && matchingResults.length > 0) {
    await matchingRepository.deleteMatchResults(matchingResults.map(result => result._id));
  }
  
  // Delete resume from database
  return await uploadRepository.deleteResume(resumeId);
};

module.exports = {
  processExcelFile,
  uploadResume,
  getUserResumes,
  deleteUserResume,
  updateAdvisorsUniversity,
};
