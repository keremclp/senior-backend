// for not importing, default import
const { createJWT, isTokenValid, attachCookiesToResponse } = require("./jwt");
const createTokenUser = require('./create-token-user')
const checkPermissions = require('./check-permissions')
const { uploadFileToS3, deleteFileFromS3, downloadFileFromS3 } = require('./s3');

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
  uploadFileToS3,
  deleteFileFromS3,
  downloadFileFromS3
};