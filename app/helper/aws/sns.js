const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'us-east-1' });
class AwsSNS {
  async sendMessage(phone, message) {
    try {
      const params = {
        Message: message,
        PhoneNumber: phone,
      };
      const response = await sns.publish(params).promise();
      return response;
    } catch (e) {
      console.log(`Error in sending message for ${phone} - ${message}`);
      console.log('Error in sendMessage', e.message);
    }
  }
}

module.exports = new AwsSNS();
