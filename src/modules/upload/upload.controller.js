const uploadService = require('./upload.service');
const { StatusCodes } = require('http-status-codes');

const uploadFile = async (req, res) => {
  try {
    await uploadService.processExcelFile(req.file.path);
    res.status(StatusCodes.OK).json({ message: 'Data imported successfully!' });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to import data.' });
  }
};

const updateAdvisorsUniversity = async (req, res) => {
  try {
    const result = await uploadService.updateAdvisorsUniversity(req.file.path);
    res.status(StatusCodes.OK).json({ 
      message: 'Advisor universities updated successfully!',
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const uploadResume = async (req, res) => {
  try {
    const resume = await uploadService.uploadResume(
      req.file, 
      req.user.userId,
      req.body.title
    );
    
    res.status(StatusCodes.CREATED).json({ 
      message: 'Resume uploaded successfully!',
      resume
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const getUserResumes = async (req, res) => {
  const resumes = await uploadService.getUserResumes(req.user.userId);
  res.status(StatusCodes.OK).json({ resumes });
};

const deleteResume = async (req, res) => {
  const { id: resumeId } = req.params;
  await uploadService.deleteUserResume(resumeId, req.user.userId);
  res.status(StatusCodes.OK).json({ message: 'Resume deleted successfully!' });
};

module.exports = {
  uploadFile,
  uploadResume,
  getUserResumes,
  deleteResume,
  updateAdvisorsUniversity,
};
