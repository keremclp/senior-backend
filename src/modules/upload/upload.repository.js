const Advisor = require('../../models/advisor.model');

const insertAdvisors = async (data) => {
  return await Advisor.insertMany(data);
};

module.exports = {
  insertAdvisors
};
