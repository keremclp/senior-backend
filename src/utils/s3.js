const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const CustomError = require('../errors');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const uploadFileToS3 = async (file, folder = 'resumes') => {
  try {
    const fileContent = fs.readFileSync(file.path);
    
    const fileName = `${folder}/${Date.now()}-${path.basename(file.originalname)}`;
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype
    };
    
    const uploaded = await s3.upload(params).promise();
    
    fs.unlinkSync(file.path);
    
    return uploaded.Location; 
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new CustomError.BadRequestError('File upload to S3 failed');
  }
};

const deleteFileFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.split('/').slice(3).join('/');
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new CustomError.BadRequestError('File deletion from S3 failed');
  }
};

module.exports = {
  uploadFileToS3,
  deleteFileFromS3
};
