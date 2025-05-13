const userRepository = require('./user.repository');
const { uploadFileToS3, deleteFileFromS3 } = require('../../utils');
const CustomError = require('../../errors');

const getUserProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }
  return user;
};

const updateUserProfile = async (userId, userData) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }
  
  // Check if email is being updated and is not already taken
  if (userData.email && userData.email !== user.email) {
    const existingUser = await userRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new CustomError.BadRequestError('Email already in use');
    }
  }
  
  return await userRepository.updateUser(userId, userData);
};

const uploadProfileImage = async (userId, file) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }
  
  // Delete old image if exists
  if (user.profileImageUrl) {
    try {
      await deleteFileFromS3(user.profileImageUrl);
    } catch (error) {
      console.error('Error deleting old profile image:', error);
    }
  }
  
  // Upload new image to S3
  const imageUrl = await uploadFileToS3(file, 'profiles-images');
  
  return await userRepository.updateUser(userId, { profileImageUrl: imageUrl });
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage
};