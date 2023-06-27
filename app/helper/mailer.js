const nodemailer = require('nodemailer');
const Email = require('email-templates');
const path = require('path');
const mailServerSettingRepo = require('../modules/mailServerSetting/repositories/mailServerSetting.repository');

class Mailer {
  constructor(setting) {
    let MAIL_USERNAME = process.env.MAIL_USERNAME;
    let MAIL_PASSWORD = process.env.MAIL_PASSWORD;
    let SMTP_SERVER = process.env.MAIL_SMTP_SERVER;
    let SMTP_PORT = process.env.MAIL_SMTP_PORT;

    if (!_.isUndefined(setting)) {
      MAIL_USERNAME = setting.email;
      MAIL_PASSWORD = setting.password;
      SMTP_SERVER = setting.smtp_server;
      SMTP_PORT = setting.port;
    }

    // this._transport = nodemailer.createTransport({
    //     host: SMTP_SERVER,
    //     secureConnection: true,
    //     port: SMTP_PORT,
    //     auth: {
    //         user: MAIL_USERNAME,
    //         pass: MAIL_PASSWORD,
    //     }
    // })

    this._transport = nodemailer.createTransport({
      host: "mail.logasapp.com",
      port: 587,
      auth: {
        user: "vivek@logasapp.com",
        pass: "45EP@R#~&4[X",
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  }

  /* @Method: sendMail
    // @Description: For sendmail
    */
  async sendMail(to, subject, tplName, locals) {
    try {
      let mailServerSetting = await mailServerSettingRepo.getByField({
        status: 'Active',
      });
      const mailer = new Mailer(mailServerSetting);
      const templateDir = path.join(
        __dirname,
        '../views/',
        'email-templates',
        tplName + '/html',
      );

      //var Email = new EmailTemplate(templateDir)
      const email = new Email({
        message: {
          from: `Ratoons<${process.env.MAIL_USERNAME}>`,
        },
        transport: {
          jsonTransport: true,
        },
        views: {
          root: templateDir,
          options: {
            extension: 'ejs',
          },
        },
      });

      let getResponse = await email.render(templateDir, locals);
      console.log('----------getResponse',getResponse)

      if (getResponse) {
        let options = {
          from: `Ratoons<${process.env.MAIL_USERNAME}>`,
          to: to,
          subject: subject,
          html: getResponse,
        };
        await mailer._transport.verify(function (error, success) {
          if (error) {
            console.log(error);
          } else {
            console.log("Server is ready to take our messages");
          }
        });

        let mailresponse = await mailer._transport.sendMail(options);
        console.log('------------mailresponse',mailresponse)

        if (mailresponse) {
          return true;
        } else {
          return false;
        }
      }
    } catch (e) {
      console.log(e.message);
      return false;
    }
  }
}
module.exports = new Mailer();
