const { sign, verify } = require("jsonwebtoken");

const createJWT = (payload ) => {
  const token = sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const isTokenValid = ({ token }) => verify(token, process.env.JWT_SECRET);

module.exports = {
  createJWT,
  isTokenValid,
};