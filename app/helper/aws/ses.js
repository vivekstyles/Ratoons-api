const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });
class AwsSES {
  async sendEmail(to, subject, html, text) {
    try {
      const params = {
        Destination: { ToAddresses: [to] },
        Message: {
          Body: {
            Html: { Charset: 'UTF-8', Data: html },
            Text: { Charset: 'UTF-8', Data: text },
          },
          Subject: { Charset: 'UTF-8', Data: subject },
        },
        Source: config.SSK_MAIL_ADDRESS,
      };
      const response = await ses.sendEmail(params).promise();
      return response;
    } catch (e) {
      console.log(`Error in sendEmail ${subject} ${e}`);
      throw new Error(e);
    }
  }
}
module.exports = new AwsSES();
