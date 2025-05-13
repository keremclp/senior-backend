// filepath: c:\Users\kerem_can\Desktop\DOSYALAR\ALL THINGS ABOUT SENIOR PROJECT\senior-backend\src\modules\user\user.repository.js
const User = require('../../models/user.model');

const findUserById = async (userId) => {
  return await User.findById(userId).select('-password');
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const updateUser = async (userId, userData) => {
  return await User.findByIdAndUpdate(
    userId,
    userData,
    { new: true, runValidators: true }
  ).select('-password');
};

module.exports = {
  findUserById,
  findUserByEmail,
  updateUser
};