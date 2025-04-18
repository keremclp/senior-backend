const xlsx = require('xlsx');
const uploadRepository = require('./upload.repository');

const processExcelFile = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  return await uploadRepository.insertAdvisors(data);
};

module.exports = {
  processExcelFile
};
