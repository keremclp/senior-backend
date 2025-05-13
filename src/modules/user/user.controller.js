const userService = require('./user.service');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');

const getUserProfile = async (req, res) => {
  const user = await userService.getUserProfile(req.user.userId);
  res.status(StatusCodes.OK).json({ 
    success: true, 
    user 
  });
};

const updateUserProfile = async (req, res) => {
  const { name, email } = req.body;
  
  const updatedUser = await userService.updateUserProfile(
    req.user.userId, 
    { name, email }
  );
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const updatedUser = await userService.uploadProfileImage(
      req.user.userId,
      req.file
    );
    
    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile image updated successfully',
      user: updatedUser
    });
  } catch (error) {
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage
};