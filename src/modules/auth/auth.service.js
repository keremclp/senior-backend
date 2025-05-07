const authRepository = require('./auth.repository');
const { createTokenUser } = require('../../utils');
const CustomError = require('../../errors');
const { createJWT } = require('../../utils/jwt');

const register = async (userData) => {
  const { email } = userData;
  
  // Check if email already exists
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new CustomError.BadRequestError('Email already exists');
  }
  
  const user = await authRepository.createUser({ ...userData });
  const tokenUser = createTokenUser(user);
  
  return { user: tokenUser };
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }
  
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }
  
  delete user.password
  const tokenUser = createTokenUser(user);

  const token = createJWT({ tokenUser, userId: user._id });
  
  return { tokenUser, token };
};

const forgotPassword = async (email) => {
  if (!email) {
    throw new CustomError.BadRequestError('Please provide email');
  }
  
  const resetToken = await authRepository.createPasswordResetToken(email);
  if (!resetToken) {
    throw new CustomError.NotFoundError('No user with that email exists');
  }
  
  // In a real application, you would send an email with this token
  // For this implementation, we'll just return the token
  return { resetToken };
};

const resetPassword = async (token, password) => {
  if (!token || !password) {
    throw new CustomError.BadRequestError('Please provide token and new password');
  }
  
  const user = await authRepository.resetPassword(token, password);
  if (!user) {
    throw new CustomError.BadRequestError('Invalid or expired token');
  }
  
  return { msg: 'Password reset successful' };
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
