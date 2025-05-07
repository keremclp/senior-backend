const authService = require('./auth.service');
const { StatusCodes } = require('http-status-codes');
const { attachCookiesToResponse } = require('../../utils');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  const { user } = await authService.register({ name, email, password });
    
  res.status(StatusCodes.CREATED).json({ user });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  const { user, token } = await authService.login(email, password);
  
  res.status(StatusCodes.OK).json({ user, token });
};

const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  
  res.status(StatusCodes.OK).json({ msg: 'User logged out!' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  const { resetToken } = await authService.forgotPassword(email);
  
  // In a production app, you would send an email here
  // For demonstration, we'll send the token in the response
  res.status(StatusCodes.OK).json({ 
    msg: 'Password reset token sent',
    resetToken
  });
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  await authService.resetPassword(token, password);
  
  res.status(StatusCodes.OK).json({ msg: 'Password reset successful' });
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
};
