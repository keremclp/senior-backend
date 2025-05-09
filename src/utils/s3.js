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
    // Parse URL to get the correct object key
    const urlObj = new URL(fileUrl);
    const pathParts = urlObj.pathname.split('/');
    
    // Get the actual path without leading slash but preserve the folder structure
    // This will ensure we get: "resumes/filename.pdf"
    let key = pathParts.filter(part => part).join('/');

    // Decode the URL-encoded characters (may need to do this twice for double-encoded characters)
    key = decodeURIComponent(key);
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };
    
    const result = await s3.deleteObject(params).promise();
    
    return result;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new CustomError.BadRequestError(`File deletion from S3 failed: ${error.message}`);
  }
};

const downloadFileFromS3 = async (fileUrl) => {
  try {
    // Parse the S3 URL to get the key
    const urlParts = new URL(fileUrl);
    const key = decodeURIComponent(urlParts.pathname.substring(1)); // Remove leading '/'
    
    // Setup params for S3 GetObject
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a temporary file path
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${path.basename(key)}`);
    
    // Get the file from S3
    const s3Object = await s3.getObject(params).promise();
    
    // Write the file to disk
    fs.writeFileSync(tempFilePath, s3Object.Body);
    
    return tempFilePath;
  } catch (error) {
    console.error('Error downloading from S3:', error);
    throw new CustomError.BadRequestError('File download from S3 failed');
  }
};



module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
  downloadFileFromS3
};
