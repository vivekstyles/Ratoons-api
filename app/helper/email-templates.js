const config = require('../config');
const ses = require('./aws/ses');
const mailer = require('./mailer');

const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: 'mail.logasapp.com',
  port: 587,
  auth: {
    user: 'vivek@logasapp.com',
    pass: '45EP@R#~&4[X',
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});
// let mailOptions = {
//   from: 'knackforge@gmail.com',
//   to: data.email_id,
//   subject: 'Sign up OTP',
//   text: otp,
// };

var mailOptions = {
  from: 'youremail@gmail.com',
  to: 'myfriend@yahoo.com',
  subject: 'Sending Email using Node.js',
  html: '<h1>Welcome</h1><p>That was easy!</p>',
};

const sendMail = (data) => {
  transporter.sendMail(data, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

class EmailTemplates {
  emailTemplate(mailContent, emailType) {
    let endPara = `If you think someone else is using your account without your consent`;
    if (emailType === 'invite') {
      endPara = `For further queries`;
    }
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style type="text/css">
            .main-div { width: 60% }
            @media only screen and (max-device-width: 600px), screen and (max-width: 600px) {
              .main-div { width: 100% !important }
            }
          </style>
        </head>
        <body>
          <div>
            <div class="main-div" style="margin: auto; background-color: #fff8f0; border: 1px solid #D3D3D3;font-family: 'Poppins', sans-serif;">
              <div style="width: 100%; overflow: hidden; position: relative;">
                <img style="width: 100%;" src="${config.EMAIL_HEADER_IMG}" height="120px" />
              </div>
              <div style="margin: 10px; color: #464646; font-size: 12pt;">
                ${mailContent}
                <div>
                  <p style="padding-top: 3px; padding-bottom: 5px;">
                    If you have received this message by mistake, ignore this email. ${endPara}, please
                    <a href="https://socialscorekeeper.com/" style="color:#F58F24"><u><strong>contact us</strong></u></a>.
                  </p>
                </div>
                <div style="color: #000; text-align: center; padding: 15px; border-top: 1px solid #D3D3D3; border-bottom: 1px solid #D3D3D3;">
                  <div style="padding-bottom: 5px">
                    <strong>Stay Connected!</strong>
                    </div>
                  <div style:"display:flex;">
                    <a href="https://www.facebook.com/"><img style="padding:4px;width:45px" src="${config.ASSET_URL}static/fb.png"/></a>
                    <a href="https://twitter.com/i/flow/login"><img style="padding:4px;width:45px" src="${config.ASSET_URL}static/twitter.png"/></a>
                    <a href="https://www.linkedin.com/login"><img style="padding:4px;width:45px" src="${config.ASSET_URL}static/linkedin.png"/></a>
                    <a href="https://www.instagram.com/accounts/login/"><img style="padding:4px;width:45px" src="${config.ASSET_URL}static/insta.png"/></a>
                  </div>
                </div>
                <div style="font-size: 10pt; text-align: center;">
                  <p>&copy; 2022 SocialScoreKeeper.com, All Rights Reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>`;
    return html;
  }

  async registration(full_name, email) {
    const html = `<div>
        <div>Hi ${full_name},</div>
        <div>
          <p>Thank you for registering with us.</p>
        </div>
        <div class="">Here's your registered Email:
            <span style="color: crimson">
                ${email}
            </span>
            <p></p>
        </div>
        <div class="">Thank You,</div>
        <div class="">Social Score Keeper</div>
      </div>`;
    const text = `Hi ${full_name}, Thank you for registering with us. Here's your registered Email: ${email} Thank You, Social Score Keeper`;
    return ses.sendEmail(
      email,
      `Social Score Keeper - Registration`,
      html,
      text,
    );
  }

  async forgotPassword(username, email, forgotPwdUrl) {
    const emailContent = `
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <p>Hello ${username},</p>
      </div>
      <div style="margin-top: 10px; margin-bottom: 10px; font-size: 16pt; color: #000;">
        <strong>Reset password</strong>
      </div>
      <div>
        <p style="padding-top: 3px; padding-bottom: 5px;">We received a request to reset your password. Click the button below and you’ll be on your way.</p>
      </div>
      <div style="margin-top: 20px; margin-bottom: 25px;  text-align: center;">
        <a href="${forgotPwdUrl}" style="color: #fff;padding: 8px;padding-left: 17px;padding-right:17px;border: 1px solid #F69522;border-radius:5px;text-decoration: none;background-image: linear-gradient(#F59123, #F05A2C)">
          <strong>Reset Password</strong>
        </a>
      </div>`;
    const html = this.emailTemplate(emailContent);
    const text = `Hi ${username}, We've received a request to reset your password. Click the link ${forgotPwdUrl} to reset your password.           If you have received this message by mistake, ignore this email. If you think someone else is using your account without your consent, please contact us. Thank You, Social Score Keeper`;
    const data = await ses.sendEmail(
      email,
      `Social Score Keeper - Reset Password`,
      html,
      text,
    );
    return data;
  }

  async passwordChanged(username, email) {
    const emailContent = `
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <p>Hello ${username},</p>
      </div>
      <div style="margin-top: 10px; margin-bottom: 10px; font-size: 16pt; color: #000;">
        <strong>Password successfully changed</strong>
      </div>
      <div>
        <p style="padding-top: 3px; padding-bottom: 5px;">The password for your social score Keeper account has been successfully changed.</p>
      </div>`;
    const html = this.emailTemplate(emailContent);
    const text = `Hello ${username}, Password successfully changed. The password for your social score Keeper account has been successfully changed. If you have received this message by mistake, ignore this email. If you think someone else is using your account without your consent, please contact us.`;
    const data = await ses.sendEmail(
      email,
      `Social Score Keeper - Password successfully changed`,
      html,
      text,
    );
    return data;
  }

  async confirmRegistration(username, email, otp) {
    console.log('mail');
    const emailContent = `
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <p>Hello ${username},</p>
      </div>
      <div style="margin-top: 10px; margin-bottom: 10px; font-size: 16pt; color: #000;">
        <strong>Confirm your registration</strong>
      </div>
      <div>
        <p style="padding-top: 3px; padding-bottom: 5px;">Welcome to Social Score Keeper! Here is your verification code:</p>
      </div>
      <div style="margin-top: 15px; margin-bottom: 15px; padding: 10px; border: 1px solid #D3D3D3; border-radius: 4px; background-color: #ffffff; text-align: center; font-size: 28pt;">
        <strong style="color: #f05f2b;">${otp}</strong>
      </div>`;
    const html = this.emailTemplate(emailContent);
    const text = `Hello ${username}, Confirm your registration. Welcome to social score keeper! Here is your verification code ${otp}. If you have received this message by mistake, ignore this email. If you think someone else is using your account without your consent, please contact us.`;
    // const data1 = await ses.sendEmail(
    //   email,
    //   `Social Score Keeper - Confirm your registration`,
    //   html,
    //   text,
    // );
    const data = transporter.sendMail(
      {
        from: 'youremail@gmail.com',
        to: email,
        subject: text,
        html: html,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      },
    );
    return data;
  }

  async verificationSuccess(username, email) {
    let locals = {
      full_name: username,
      email: email,
      site_title: 'Ratoons',
    };

    const res = await mailer.sendMail(
      email,
      'Welcome',
      'registration',
      locals,
    );
    return res;

    const emailContent = `
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <p>Hello ${username},</p>
      </div>
      <div style="margin-top: 10px; margin-bottom: 10px; font-size: 16pt; color: #000;">
        <strong>Verification Successful</strong>
      </div>
      <div>
        <p style="padding-top: 3px; padding-bottom: 5px;">Congratulations! Your account has been verified successfully.</p>
      </div>`;
    const html = this.emailTemplate(emailContent);
    const text = `Hello ${username}, Verification Successful. Congratulations! Your account has been verified successfully. If you have received this message by mistake, ignore this email. If you think someone else is using your account without your consent, please contact us.`;
    const data = await ses.sendEmail(
      email,
      `Social Score Keeper - Verification Successful`,
      html,
      text,
    );
    return data;
  }

  async partnerInviteEmail(senderName, params) {
    const emailContent = `
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <p>Hello${params.name ? ' ' + params.name : ''},</p>
      </div>
      <div style="margin-top: 10px; margin-bottom: 10px; font-size: 16pt; color: #000;">
        <strong>Partner Invite</strong>
      </div>
      <div>
        <p style="padding-top: 3px; padding-bottom: 5px;">${senderName} has invited you to join as ${
      params.inviteType
    } in Social Score Keeper. Click the button below to accept the invite. </p>
      </div>
      <div style="margin-top: 20px; margin-bottom: 25px;  text-align: center;">
        <a href="${
          params.link
        }" style="color: #fff;padding: 8px;padding-left: 17px;padding-right:17px;border: 1px solid #F69522;border-radius:5px;text-decoration: none;background-image: linear-gradient(#F59123, #F05A2C)">
          <strong>Accept</strong>
        </a>
      </div>`;
    const html = this.emailTemplate(emailContent, 'invite');
    const text = `Hello ${params.name}, ${senderName} has invited you to join as ${params.inviteType} in Social Score Keeper. Click the link below to accept the invite.. ${params.link}`;
    const data = await ses.sendEmail(
      params.email,
      `Social Score Keeper - Partner Invite`,
      html,
      text,
    );
    return data;
  }
}
module.exports = new EmailTemplates();
