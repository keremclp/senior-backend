const userService = require('./user.service');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const userRepository = require('./user.repository');
const { getSignedUrl } = require('../../utils/s3');

const getUserProfile = async (req, res) => {
  
  const user = await userRepository.findUserById(req.user.userId);
  console.log('User:', user);
  
  // Generate signed URL if profile image exists
  if (user && user.profileImageUrl) {
    try {
      // Extract just the key portion (path after bucket name)
      const urlObj = new URL(user.profileImageUrl);
      const pathParts = urlObj.pathname.split('/');
      
      // Remove the first empty element (from leading slash)
      pathParts.shift(); 
      
      // Remove the bucket name if it's in the path
      if (pathParts[0] === process.env.S3_BUCKET_NAME) {
        pathParts.shift();
      }
      
      // Join the remaining path parts to get the key
      const key = pathParts.join('/');
      console.log('Extracted key:', key);
      
      // Generate the signed URL
      user.profileImageUrl = await getSignedUrl(key);
      console.log('Generated signed URL:', user.profileImageUrl);
    } catch (error) {
      console.error('Error generating signed URL for profile image:', error);
      // Keep the original URL if signed URL generation fails
    }
  }

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