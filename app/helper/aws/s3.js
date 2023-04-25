const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: 'us-east-1' });
const BUCKET_NAME = 'ssk-asset';
class AwsS3 {
  async upload(key, body, contentType) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      };
      return s3.upload(params).promise();
    } catch (e) {
      console.log(`Error uploading file ${data.Key}`);
      console.log(`Error: ${e}`);
    }
  }

  async remove(fileName) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
    };
    try {
      await s3.headObject(params).promise();
      try {
        return await s3.deleteObject(params).promise();
      } catch (e) {
        console.log(
          `Error while deleting file from S3: ${fileName} ${e.message}`,
        );
      }
    } catch (e) {
      console.log(`File Not Found in S3: ${fileName} ${e.message}`);
    }
  }
}
module.exports = new AwsS3();
