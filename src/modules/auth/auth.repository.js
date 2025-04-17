const User = require('./models/user.model');
const crypto = require('crypto');

const createUser = async (userData) => {
  return await User.create(userData);
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const findUserById = async (id) => {
  return await User.findById(id);
};

const createPasswordResetToken = async (email) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    return null;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time - 10 minutes
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  await user.save();
  
  return resetToken;
};

const resetPassword = async (resetToken, newPassword) => {
  // Hash the token to compare with stored hash
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return null;
  }

  // Update password and clear reset fields
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  return user;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  createPasswordResetToken,
  resetPassword
};
