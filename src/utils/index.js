// for not importing, default import
const { createJWT, isTokenValid, attachCookiesToResponse } = require("./jwt");
const createTokenUser = require('./create-token-user')
const checkPermissions = require('./check-permissions')
module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
};