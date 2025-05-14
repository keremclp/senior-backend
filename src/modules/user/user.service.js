const userRepository = require('./user.repository');
const { uploadFileToS3, deleteFileFromS3 } = require('../../utils');
const CustomError = require('../../errors');
const { getSignedUrl } = require('../../utils/s3');


const getUserProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }
  
  // If there's a profile image key, generate a fresh signed URL
  if (user.profileImageUrl) {
    try {
      const signedUrl = await getSignedUrl(user.profileImageUrl);
      // Create a new object to avoid modifying the database object
      return {
        ...user.toObject ? user.toObject() : user,
        profileImageUrl: signedUrl
      };
    } catch (error) {
      console.error('Error generating signed URL for profile image:', error);
      // Continue with the original user object if there's an error
    }
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
  if (user.profileImageUrl && user.profileImageUrl !== '') {
    console.log('Deleting old profile image:', user.profileImageUrl);
    try {
      // If storing keys, just pass the key directly
      await deleteFileFromS3(user.profileImageUrl);
    } catch (error) {
      console.error('Error deleting old profile image:', error);
    }
  }
  
  // Upload new image to S3
  const uploadResult = await uploadFileToS3(file, 'profiles-images');
  
  // Use the key directly from the upload result
  const key = uploadResult.Key;
  console.log('Using key directly from upload:', key);
  
  // Store the KEY in the database, not the signed URL
  
  // Generate a signed URL for the response
  const signedUrl = await getSignedUrl(key);
  console.log('Generated signed URL:', signedUrl);
  
  const updatedUser = await userRepository.updateUser(userId, { profileImageUrl: signedUrl });
  // Return the user with a valid signed URL for immediate use
  return {
    ...updatedUser.toObject ? updatedUser.toObject() : updatedUser,
    profileImageUrl: signedUrl
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage
};