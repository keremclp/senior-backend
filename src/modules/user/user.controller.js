const userService = require('./user.service');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const userRepository = require('./user.repository');

const getUserProfile = async (req, res) => {
  
  const user = await userRepository.findUserById(req.user.userId);
  console.log('User:', user);

  console.log('User after processing:', user);
  
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'User profile retrieved successfully',
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