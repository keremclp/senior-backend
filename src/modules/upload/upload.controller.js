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

module.exports = {
  uploadFile
};
