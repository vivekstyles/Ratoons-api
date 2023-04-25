const mongoose = require('mongoose');
const userRepo = require('../../modules/user/repositories/user.repository');
const roleRepo = require('role/repositories/role.repository');
const userTempRepo = require('user_temp/repositories/user_temp.repository');
const userModel = require('user/models/user.model.js');
const express = require('express');
const routeLabel = require('route-label');
const helper = require('../../helper/helper.js');
const mailer = require('../../helper/mailer.js');
const emailTemplate = require('../../helper/email-templates');
const router = express.Router();
const User = new userModel();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
const gm = require('gm').subClass({
  imageMagick: true,
});
const otpGenerator = require('otp-generator');
var moment = require('moment');
const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');
const request = require('request-promise');
const APPLE_IDENTITY_URL = 'https://appleid.apple.com';
const superagent = require('superagent');
// const athleteRepo = require('athlete/repositories/athlete.repository');  // vivek cleaning
const resetPwdRepo = require('reset_password/repositories/reset_password.repository');
const deviceInfoRepo = require('../device_info/repositories/device_info.repository');
const notificationCont = require('../notifications/controllers/notifications.controller');
//mail send
const { join } = require('path');
const ejs = require('ejs');
const { readFile } = require('fs');
const { promisify } = require('util');
// const subscription = require('../../modules/webservice/subscription.controller'); vivek cleaning
const otpRepo = require('../otp/repositories/otp.repository');
const sns = require('../../helper/aws/sns');
const inviteRepo = require('../invites/repositories/invites.repository');
const { ucFirstLetter } = require('../../helper/helper.js');
class UserController {
  constructor() {}

  async createTokens(user, deviceId) {
    await user.populate({ path: 'role', select: 'role' });
    const payload = { id: user._id, deviceId: deviceId, role: user.role.role };
    return jwt.sign(payload, config.jwtSecret, {});
  }

  async generateInviteCode() {
    let isUniqueCode = false;
    do {
      const randomStr = Math.random().toString(36).substr(2, 6);
      const isExists = await userRepo.findOne({
        $or: [
          {
            partner_code: randomStr,
          },
          { fan_code: randomStr },
        ],
      });
      if (!isExists) {
        isUniqueCode = true;
        return randomStr;
      }
    } while (!isUniqueCode);
  }

  async createUser(req) {
    let userRole = '';
    let inviteType = '';
    let addInviteNotification = false;
    let params = {};
    if (req.body.inviteCode) {
      params = { referralCode: req.body.inviteCode };
    } else {
      params = {
        $or: [
          { email: req.body.email?.trim() },
          { phone: req.body.phone?.trim() || '' },
        ],
      };
    }
    // get if referral code exists in any user
    let getInvitedUser = await userRepo.getByField({
      $or: [
        { partner_code: req.body.inviteCode },
        { fan_code: req.body.inviteCode },
      ],
    });

    // check if email or phone referral exists in invite
    var invite = await inviteRepo.findOne({
      ...params,
      status: 'pending',
      isActive: true,
    });

    // if email not in invite and refered user exists insert into
    // invite as a copy url
    if (!invite && getInvitedUser && getInvitedUser._id) {
      invite = await inviteRepo.save({
        name: req.body.full_name,
        email: req.body.email,
        referralCode: getInvitedUser.partner_code,
        invitedBy: getInvitedUser._id,
        inviteType: 'partner-invite',
        invitedVia: 'link',
        status: 'pending',
      });
    }

    if (invite) {
      const emailInvite = await inviteRepo.findOne({
        invitedBy: invite.invitedBy,
        status: 'pending',
        isActive: true,
        isDeleted: false,
      });

      if (!emailInvite || req.body.email == emailInvite.email) {
        addInviteNotification = true;
        inviteType = invite.inviteType.split('-')[0];
        const role = await roleRepo.getByField({
          role: inviteType || 'partner',
        });
        userRole = role._id;
      }
    }

    if (!userRole) {
      const role = await roleRepo.getByField({ role: 'creator' });
      userRole = role?._id;
    }
    req.body.role = userRole;
    //check user phone no available checking
    if (req.body.phone && req.body.phone != '') {
      let checkPhone = await userRepo.getByField({
        phone: req.body.phone,
        isDeleted: false,
      });
      if (checkPhone) {
        return {
          status: 409,
          message: 'Phone no. already exists.',
        };
      }
    }
    const data = req.body;
    //Check if user is invited already
    let tempData = await userTempRepo.getByField({
      isDeleted: false,
      status: 'Active',
      email: req.body.email,
    });
    if (tempData) {
      data.parent_id = tempData.parent_id;
      if (tempData.atheletic_id != null) {
        data.atheletic_id = tempData.atheletic_id;
      }
    }
    if (req.body.password) {
      data.password = User.generateHash(req.body.password);
    }
    if (data.register_type) {
      //Set register type and social id
      data[`${data.register_type}_id`] = data.social_id;
      data.register_type = 'social';
      data.isEmailVerified = true;
      delete data.social_id;
    }
    const profile_pic = data.profile_pic;
    delete data.profile_pic;
    data.partner_code = await this.generateInviteCode();
    data.fan_code = await this.generateInviteCode();
    const userData = await userRepo.save(data);
    if (userData) {
      let locals = {
        full_name: userData.full_name,
        email: req.body.email,
        site_title: 'Ratoons',
      };
      const test = await mailer.sendMail(
        `Ratoons<${process.env.MAIL_USERNAME}>`,
        req.body.email,
        'Welcome',
        'registration',
        locals,
      );
      console.log('------------>',test)
      if (addInviteNotification) {
        invite.user = userData._id;
        await invite.save();
        await notificationCont.createOnRegister(userData, {
          sentBy: invite.invitedBy,
          title: `${ucFirstLetter(inviteType)} invite`,
          message: `You have an invite to join as ${inviteType}`,
          user: userData._id,
          type: `${inviteType}-requested`,
          invite: invite._id,
        });
      }
      //Send verification email if user source is from social login
      if (userData.isEmailVerified) {
        const res = await emailTemplate.verificationSuccess(
          userData.full_name,
          userData.email,
        );
        if (res) userData.isVerifyEmail = true;
      }
      const token = await this.createTokens(
        userData,
        req.body.deviceInfo?.deviceId,
      );
      //Create or update device details
      if (req.body.deviceInfo) {
        await deviceInfoRepo.upsert(userData._id, req.body.deviceInfo);
      }
      let file, fileExt, newFileName;
      if (req.file) {
        file = req.file;
        fileExt = file.mimetype.split('/')[1];
        newFileName = `${Date.now()}.${fileExt}`;
      } else if (profile_pic?.uri.includes('http')) {
        fileExt = profile_pic.type.split('/')[1];
        newFileName = `${Date.now()}.${fileExt}`;
        var options = {
          url: profile_pic.uri,
          method: 'get',
          encoding: null,
        };
        let buffer;
        await request(options, function (error, response, body) {
          if (!error) {
            buffer = body;
          }
        });
        // const buffer = Buffer.from(response.data, 'utf-8');
        file = { buffer: buffer, mimetype: profile_pic.type };
      }
      if (file) {
        const response = await helper.uploadFile(
          file, // file to be uploaded
          `user/profile_pic/user_${userData._id}/`, // s3 path
          true, // generate thumb image
          100, // resize pixels
          userData.profile_pic, //prev image path
          newFileName, //new file name
        );
        //Save profile pic path to user
        userData.profile_pic = response.Key;
      }
      // userData.partner_code = await this.generateInviteCode();
      await userData.save();
      const response = _.omit(userData.toObject(), [
        'password',
        'createdAt',
        'updatedAt',
      ]);
      return {
        status: 200,
        data: response,
        token: token,
        message: 'Account created successfully.',
      };
    } else {
      return { status: 201, data: {}, message: 'Somethig went wrong!' };
    }
  }

  async register(req, res) {
    try {
      let checkUser = await userRepo.getUserForAuthentication({
        email: req.body.email.trim().toLowerCase(),
        isDeleted: false,
      });
      if (checkUser) {
        return { status: 409, message: 'Email already exists.' };
      }
      const response = await this.createUser(req);
      if (response.status === 200) {
        await this.sendOTP(response.data);
      }
      return response;
    } catch (e) {
      console.log('Error in register', e);
      return { status: 500, message: e.message };
    }
  }

  async checkUser(req) {
    try {
      let params = { email: req.body.value.trim().toLowerCase() };
      if (req.body.type == 'social_id') {
        params = {
          $or: [
            { facebook_id: req.body.value },
            { google_id: req.body.value },
            { apple_id: req.body.value },
          ],
        };
      }
      let checkUser = await userRepo.getByField(params);
      if (checkUser) {
        return { status: 409, isExists: true, message: 'User already exists.' };
      } else {
        return { status: 200, isExists: false, message: 'User not found' };
      }
    } catch (e) {
      console.log('Error in checkUser', e);
      return { status: 500, message: e.message };
    }
  }

  async login(req, res) {
    try {
      const params = { isDeleted: false };
      if (req.body.social_id && req.body.register_type) {
        params[`${req.body.register_type}_id`] = req.body.social_id;
      } else if (req.body.email) {
        params.email = req.body.email.trim().toLowerCase();
      } else {
        return { status: 400, message: 'Invalid payload' };
      }
      let user = await userRepo.getUserForAuthentication(params);
      if (!user && req.body.register_type) {
        const response = await this.createUser(req);
        return response;
      }
      if (!user) {
        return { status: 404, message: 'User not found.' };
      }
      if (user.status && user.status !== 'Active') {
        return {
          status: 201,
          message: 'Your Account is not active.',
        };
      }
      if (!req.body.register_type && req.body.password) {
        //if normal login check for password
        if (!user.validPassword(req.body.password, user.password)) {
          return {
            status: 400,
            message: 'Invalid username or password',
          };
        }
      } else if (
        req.body.register_type &&
        req.body.social_id &&
        !req.body.password
      ) {
        //if social login update social id
        user[`${req.body.register_type}_id`] = req.body.social_id;
        await user.save();
      } else {
        return {
          status: 400,
          message:
            'Cannot login! Please provide password or social login details.',
        };
      }
      const token = await this.createTokens(
        user,
        req.body.deviceInfo?.uniqueId,
      );
      //Create or update device details
      if (req.body.deviceInfo) {
        await deviceInfoRepo.upsert(user._id, req.body.deviceInfo);
      }
      //  vivek commended start
      // const subRes = await subscription.getSubscriptionStatus(user._id);
      // if (!subRes.isSubActive) {
      //   let checkSub = await userRepo.getUsersByField({ partner: user._id });
      //   const partnerSubRes = await subscription.getSubscriptionStatus(
      //     checkSub._id,
      //   );
      //   subRes.isSubActive = partnerSubRes.isSubActive;
      //   subRes.subscription = partnerSubRes.subscription;
      // }
      // vivek commended ends
      const response = _.omit(user.toObject(), [
        'password',
        'createdAt',
        'updatedAt',
      ]);
      return {
        status: 200,
        data: response,
        token: token,
        // isSubscribed: subRes.isSubActive, vivek  commended
        // subscription: subRes.subscription, vivek commended
        message: 'You have successfully logged in.',
      };
    } catch (e) {
      console.log('Error in login', e);
      return { status: 500, message: e.message };
    }
  }

  async forgotPassword(req, res) {
    try {
      const value = req.body.value.trim();
      const type = req.body.type.trim();
      if (type === 'email' && value === '') {
        return { status: 400, message: 'Email address is required.' };
      }
      if (type === 'phone' && value === '') {
        return { status: 400, message: 'Phone no. is required.' };
      }
      let userData = await userRepo.getUserByField({
        [type]: value,
        isDeleted: false,
      });
      if (userData) {
        if (userData.status === 'Inactive') {
          return { status: 201, message: 'You account is inactive.' };
        } else {
          const resetPwd = await resetPwdRepo.create({
            user: userData._id,
            type: type,
          });
          const params = `reset-password*${resetPwd.token}`;
          const forgotPwdUrl = `${config.SSK_WEB_URL}deeplink/${params}`;
          if (req.body.type === 'email') {
            await emailTemplate.forgotPassword(
              userData.full_name,
              userData.email,
              forgotPwdUrl,
            );
          }
          if (req.body.type === 'phone') {
            // send reset pwd link to message
            const message = `Hi, Please click the link to reset your password. ${forgotPwdUrl}`;
            await sns.sendMessage(userData.phone, message);
          }
          return {
            status: 200,
            message: `We have sent a link to your ${req.body.type} to reset the password`,
          };
        }
      } else {
        return {
          status: 201,
          data: {},
          message: 'You do not appear to have an account. Please signup.',
        };
      }
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }

  async verifyToken(req, res) {
    try {
      const data = await resetPwdRepo.findOne({
        token: req.body.token,
        isVerified: false,
      });
      if (!data) {
        return { status: 400, message: 'Invalid token' };
      }
      data.isVerified = true;
      await data.save();
      return { status: 200, message: 'Token verified successfully.' };
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  async updatePassword(userData, req, isChangePwd = false) {
    if (!userData) {
      return { status: 404, message: 'User not Found.' };
    }
    if (userData.status !== 'Active' || userData.isDeleted === true) {
      return { status: 400, message: 'Your account is not active' };
    }
    if (isChangePwd) {
      if (req.body.old_password !== req.body.new_password) {
        if (!userData.validPassword(req.body.old_password, userData.password)) {
          return { status: 400, message: 'Incorrect old password.' };
        }
      } else {
        return {
          status: 400,
          message: 'Old and new password should not be same.',
        };
      }
    }
    let newPassword = userData.generateHash(req.body.new_password);
    let updatedUser = await userRepo.updateById(
      { password: newPassword },
      userData._id,
    );
    if (!updatedUser) {
      return { status: 500, message: 'Unable to update the password.' };
    }
    return { status: 200, message: 'Password Changed Successfully.' };
  }

  async resetPassword(req, res) {
    try {
      const resetPwd = await resetPwdRepo.findByToken(req.body.token);
      if (!resetPwd) {
        return { status: 400, message: 'Invalid token' };
      }
      if (!resetPwd.isActive) {
        return { status: 400, message: 'Token expired' };
      }
      if (!resetPwd.isVerified) {
        return { status: 409, message: 'Token is not verified' };
      }
      const user = await userRepo.getUserForAuthentication({
        _id: resetPwd.user,
      });
      const response = await this.updatePassword(user, req);
      resetPwd.isActive = false;
      await resetPwd.save();
      await emailTemplate.passwordChanged(user.full_name, user.email);
      return response;
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  async changePassword(req, res) {
    try {
      let userData = await userRepo.getUserForAuthentication({
        _id: req.user._id,
      });
      return this.updatePassword(userData, req, true);
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }

  async getProfile(req, res) {
    try {
      const userData = await userRepo.getById(req.user._id);
      let isSubscribed = await subscription.getSubscriptionStatus(req.user._id);
      if (!isSubscribed.isSubActive) {
        let checkSub = await userRepo.getUsersByField({
          partner: req.user._id,
        });
        const partnerSubRes = await subscription.getSubscriptionStatus(
          checkSub._id,
        );
        isSubscribed = partnerSubRes;
      }
      return {
        status: 200,
        data: userData,
        isSubscribed: isSubscribed.isSubActive,
        subscription: isSubscribed.subscription,
        message: 'Profile fetched successfully.',
      };
    } catch (error) {
      return { status: 201, data: {}, message: error.message };
    }
  }

  async UpdateProfile(req, res) {
    try {
      const userData = await userRepo.getUserForAuthentication({
        _id: req.user._id,
      });
      const data = req.body;
      if (req.file) {
        const file = req.file;
        const fileExt = file.mimetype.split('/')[1];
        const newFileName = `${Date.now()}.${fileExt}`;
        const response = await helper.uploadFile(
          file, // file to be uploaded
          `user/profile_pic/user_${userData._id}/`, // s3 path
          true, // generate thumb image
          100, // resize pixels
          userData.profile_pic, //prev image path
          newFileName, //new file name
        );
        //Save profile pic path to user
        userData.profile_pic = response.Key;
      }
      if (data.full_name) userData.full_name = data.full_name;
      if (_.has(data, 'phone')) {
        if (data.phone?.length > 0) {
          let checkPhone = await userRepo.getByField({
            phone: data.phone,
            isDeleted: false,
          });
          if (checkPhone) {
            return {
              status: 409,
              message: 'Phone no. already exists.',
            };
          }
        }
        userData.phone = data.phone;
        userData.isPhoneVerified = false;
      }
      if (_.has(data, 'push_notification'))
        userData.push_notification = data.push_notification;
      if (_.has(data, 'email_notification'))
        userData.email_notification = data.email_notification;
      if (_.has(data, 'sms_notification'))
        userData.sms_notification = data.sms_notification;
      if (data.color_theme) userData.color_theme = data.color_theme;
      await userData.save();
      const result = _.omit(userData.toObject(), [
        'password',
        'createdAt',
        'updatedAt',
      ]);
      return {
        status: 200,
        data: result,
        message: 'Profile data updated successfully.',
      };
    } catch (error) {
      console.log('Error in update profile', error);
      return { status: 500, message: error.message };
    }
  }

  async faninvite(req) {
    try {
      let role = await roleRepo.getByField({ role: 'fan' });
      req.body.role = role._id;
      const userData = await userRepo.getById(req.user._id);
      //user email available checking
      if (!_.isEmpty(req.body.email)) {
        let checkEmail = await userRepo.getByField({
          email: req.body.email,
          isDeleted: false,
        });
        if (!_.isEmpty(checkEmail)) {
          var message = `https://${process.env.SERVER_HOST}/user/login`;
          let locals = {
            creator_email: userData.email,
            email: req.body.email,
            site_title: 'Social Score Keeper', //settingObj.Site_Title,
            message: message,
          };

          var isMailSend = await mailer.sendMail(
            `Admin<${process.env.MAIL_USERNAME}>`,
            req.body.email,
            'Welcome!',
            'invite',
            locals,
          );
          return {
            status: 200,
            data: message,
            message: 'Fan invite sent successfully.',
          };
        } else {
          var message = `https://${process.env.SERVER_HOST}/user/fansignup`;
          let locals = {
            creator_email: userData.email,
            email: req.body.email,
            site_title: 'Social Score Keeper', //settingObj.Site_Title
            message: message,
          };

          var isMailSend = await mailer.sendMail(
            `Admin<${process.env.MAIL_USERNAME}>`,
            req.body.email,
            'Welcome!',
            'invite',
            locals,
          );
          return {
            status: 200,
            data: message,
            message: 'Fan invite sent successfully.',
          };
        }
      }
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }
  // vivek cleaning
  // async sendInvitation(req, res) {
  //   try {
  //     let roleData = await roleRepo.getByField({ role: req.body.role });

  //     if (_.isEmpty(roleData)) {
  //       return { status: 201, data: {}, message: 'User role is invalid!' };
  //     }

  //     if (req.body.email == null || req.body.email == '') {
  //       return { status: 201, data: {}, message: 'Email is required' };
  //     }

  //     if (req.body.full_name == null || req.body.full_name == '') {
  //       return { status: 201, data: {}, message: 'Name is required' };
  //     }

  //     let parent_id = mongoose.Types.ObjectId(req.user._id);
  //     let parentData = await userRepo.getByField({
  //       _id: parent_id,
  //       isDeleted: false,
  //       status: 'Active',
  //     });

  //     if (!_.isEmpty(parentData)) {
  //       // let referral_code;
  //       // if(parentData.referral_code == null || parentData.referral_code == ''){
  //       // 	let randomNum = Math.random().toString().substring(2,6);
  //       // 	referral_code = randomNum;
  //       // 	await userRepo.updateById({referral_code:randomNum}, parent_id)
  //       // }else{
  //       // 	referral_code = parentData.referral_code;
  //       // }

  //       let userData = await userRepo.getByField({
  //         email: req.body.email,
  //         isDeleted: false,
  //         status: 'Active',
  //       });

  //       if (_.isEmpty(userData)) {
  //         let locals = {
  //           creator_name: parentData.full_name,
  //           fan_name: req.body.full_name,
  //           site_title: 'Social Score Keeper',
  //           invite_link: `https://${process.env.SERVER_HOST}/user/fansignup`,
  //           message: `You are invited by ${parentData.full_name} to becoming ${roleData.roleDisplayName}. Please proceed with this given invitation link.`,
  //         };

  //         let tempData = await userTempRepo.getByField({
  //           isDeleted: false,
  //           status: 'Active',
  //           email: req.body.email,
  //         });

  //         if (_.isEmpty(tempData)) {
  //           let temp_data = {
  //             parent_id: parent_id,
  //             name: req.body.full_name,
  //             email: req.body.email,
  //             phone: req.body.phone,
  //             role: roleData._id,
  //           };

  //           if (req.body.atheletic_id != null && req.body.atheletic_id != '') {
  //             let athleteData = await athleteRepo.getByField({
  //               isDeleted: false,
  //               status: 'Active',
  //               creator_id: parent_id,
  //             });
  //             if (!_.isEmpty(athleteData)) {
  //               temp_data.atheletic_id = req.body.atheletic_id;
  //             }
  //           }

  //           let saveTempUser = await userTempRepo.save(temp_data);

  //           var isMailSend = await mailer.sendMail(
  //             `Social Score Keeper<${process.env.MAIL_USERNAME}>`,
  //             req.body.email,
  //             'Invitation',
  //             'invitation',
  //             locals,
  //           );

  //           if (isMailSend) {
  //             return {
  //               status: 200,
  //               data: {},
  //               message: 'Invitation sent successfully.',
  //             };
  //           } else {
  //             return {
  //               status: 201,
  //               data: {},
  //               message: 'Unable to send invitation at the moment!',
  //             };
  //           }
  //         } else {
  //           if (parent_id.toString() == tempData.parent_id.toString()) {
  //             var isMailSend = await mailer.sendMail(
  //               `Social Score Keeper<${process.env.MAIL_USERNAME}>`,
  //               req.body.email,
  //               'Invitation',
  //               'invitation',
  //               locals,
  //             );

  //             if (isMailSend) {
  //               return {
  //                 status: 200,
  //                 data: {},
  //                 message: 'Invitation sent successfully.',
  //               };
  //             } else {
  //               return {
  //                 status: 201,
  //                 data: {},
  //                 message: 'Unable to send invitation at the moment!',
  //               };
  //             }
  //           } else {
  //             return {
  //               status: 201,
  //               data: {},
  //               message: 'User already invited by other creator!',
  //             };
  //           }
  //         }
  //       } else {
  //         return {
  //           status: 201,
  //           data: {},
  //           message: 'User already registered into the system!',
  //         };
  //       }
  //     } else {
  //       return { status: 201, data: {}, message: 'No user found!' };
  //     }
  //   } catch (e) {
  //     return { status: 500, message: e.message };
  //   }
  // }

  async pendingInvitation(req, res) {
    try {
      let parent_id = mongoose.Types.ObjectId(req.user._id);

      let roleData = await roleRepo.getByField({ role: req.query.role });

      if (_.isEmpty(roleData)) {
        return { status: 200, data: {}, message: 'User role is invalid!' };
      }

      let tempUserData = await userTempRepo.getAllByField({
        parent_id: parent_id,
        isDeleted: false,
        status: 'Active',
        role: roleData._id,
      });

      if (!_.isEmpty(tempUserData)) {
        return {
          status: 200,
          data: tempUserData,
          message: `${roleData.roleDisplayName} Invitation fetched successfully.`,
        };
      } else {
        return { status: 200, data: {}, message: 'No record found!' };
      }
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  async acceptInvitation(req, res) {
    try {
      let parent_id = mongoose.Types.ObjectId(req.user._id);

      let roleData = await roleRepo.getByField({ role: req.body.role });

      if (_.isEmpty(roleData)) {
        return { status: 200, data: {}, message: 'User role is invalid!' };
      }

      let query = {
        parent_id: { $in: parent_id },
        isDeleted: false,
        status: 'Active',
        role: roleData._id,
      };

      if (req.body.atheletic_id != null && req.body.atheletic_id != '') {
        query.atheletic_id = mongoose.Types.ObjectId(req.body.atheletic_id);
      }

      let userData = await userRepo.getAllByField(query);

      if (!_.isEmpty(userData)) {
        return {
          status: 200,
          data: userData,
          message: `${roleData.roleDisplayName} Invitation accepted fetched successfully.`,
        };
      } else {
        return { status: 200, data: {}, message: 'No record found!' };
      }
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  async userDelete(req, res) {
    try {
      let parent_id = mongoose.Types.ObjectId(req.user._id);
      let user_id = req.params.user_id;
      if (!user_id) {
        return { status: 200, data: {}, message: 'User Id is required!' };
      }
      let userData = await userRepo.getByField({
        _id: mongoose.Types.ObjectId(user_id),
        isDeleted: false,
        status: 'Active',
        parent_id: { $in: [parent_id] },
      });

      if (!_.isEmpty(userData)) {
        let roleData = await roleRepo.getByField({ _id: userData.role });

        if (userData.parent_id.length > 1) {
          let ids = userData.parent_id;

          for (let i in ids) {
            if (ids[i].toString() == parent_id.toString()) {
              ids.splice(i, 1);
            }
          }

          let updateUser = await userRepo.updateById(
            { parent_id: ids },
            userData._id,
          );

          if (!_.isEmpty(updateUser)) {
            return {
              status: 200,
              data: updateUser,
              message: `${roleData.roleDisplayName} deleted successfully.`,
            };
          } else {
            return {
              status: 200,
              data: {},
              message: 'Unable to delete at the moment!',
            };
          }
        } else {
          let deleteUser = await userRepo.updateById(
            { isDeleted: true },
            userData._id,
          );

          if (!_.isEmpty(deleteUser)) {
            return {
              status: 200,
              data: deleteUser,
              message: `${roleData.roleDisplayName} deleted successfully.`,
            };
          } else {
            return {
              status: 200,
              data: {},
              message: 'Unable to delete at the moment!',
            };
          }
        }
      } else {
        return { status: 200, data: {}, message: 'No record found!' };
      }
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  async generateOTP() {
    let isUniqueCode = false;
    let otp;
    do {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const isExists = await otpRepo.findByOtp(otp);
      if (!isExists) {
        isUniqueCode = true;
        return otp;
      }
    } while (!isUniqueCode || otp.length < 6);
  }

  async sendOtpToEmail(user) {
    const otp = await this.generateOTP();
    console.log(otp)
    //mark prev generated otps as inactive
    await otpRepo.expirePreviousOtps(user, 'email');
    //create new otp
    await otpRepo.create({ user: user._id, otp: otp, type: 'email' });
    // send otp via email
    await emailTemplate.confirmRegistration(user.full_name, user.email, otp);
    return otp;
  }

  async sendOtpToSms(user) {
    const otp = await this.generateOTP();
    //mark prev generated otps as inactive
    await otpRepo.expirePreviousOtps(user, 'sms');
    //create new otp
    await otpRepo.create({ user: user._id, otp: otp, type: 'sms' });
    // send otp via sms => to be added
    const message = `Hi, Your SocialScoreKeeper account verification code is: ${otp}. Don't share it with anyone.`;
    await sns.sendMessage(user.phone, message);
    return otp;
  }

  async sendOTP(user, send_to = 'all') {
    if (['email', 'sms', 'all'].indexOf(send_to) === -1) {
      return {
        status: 400,
        message: 'Invalid otp type. Only email, sms or all is accepted',
      };
    }
    if (!user.phone && send_to === 'sms') {
      return { status: 400, message: 'Phone no. not available' };
    }
    const response = { email: undefined, sms: undefined };
    if (send_to === 'all' || send_to === 'email') {
      if (user.isEmailVerified) {
        response.email = {
          status: 'error',
          message: 'Email already verified.',
        };
      } else {
        await this.sendOtpToEmail(user);
        response.email = {
          status: 'success',
          message: 'Otp sent to email',
        };
      }
    }
    // To be done
    if (user.phone && (send_to === 'all' || send_to === 'sms')) {
      if (user.isPhoneVerified) {
        response.sms = {
          status: 'error',
          message: 'Phone no. already verified',
        };
      } else {
        await this.sendOtpToSms(user);
        response.sms = {
          status: 'success',
          message: 'Otp sent to phone no',
        };
      }
    }
    return {
      status: 200,
      data: response,
    };
  }

  async verifyOTP(user, params) {
    console.log(user);
    if (!params.email && !params.sms) {
      return { status: 400, message: 'Email and sms params cannot be empty' };
    }
    let email, sms;
    if (params.email) {
      const value = params.email;
      if (value.length !== 6 || !parseInt(value)) {
        email = { status: 'error', message: 'Invalid OTP format' };
      } else {
        email = await this.validateOTP(value, 'email', user._id);
        if (email.status === 'success') user.isEmailVerified = true;
      }
    }
    if (params.sms) {
      const value = params.sms;
      if (value.length !== 6 || !parseInt(value)) {
        sms = { status: 'error', message: 'Invalid OTP format' };
      } else {
        sms = await this.validateOTP(value, 'sms', user._id);
        if (sms.status === 'success') user.isPhoneVerified = true;
      }
    }
    if (user.isEmailVerified && !user.isVerifyEmail) {
      //Send verified successfully email
      const res = await emailTemplate.verificationSuccess(
        user.full_name,
        user.email,
      );
      if (res) {
        user.isVerifyEmail = true;
      }
    }
    await user.save();
    return {
      status: 200,
      data: { email: email, sms: sms },
    };
  }

  async validateOTP(otp, type, userId) {
    const otpData = await otpRepo.findOne({
      otp: otp,
      type: type,
      user: userId,
    });
    console.log(otpData);
    if (!otpData || !otpData.isActive) {
      return { status: 'error', message: 'Invalid OTP' };
    }
    if (otpData.isVerified) {
      return { status: 'success', message: 'OTP verified already' };
    }
    otpData.isVerified = true;
    await otpData.save();
    return { status: 'success', message: 'OTP verified' };
  }

  async updateFCMToken(userId, deviceId, data) {
    try {
      //Clear previous user tokens
      await deviceInfoRepo.clearPreviousUserTokens(deviceId, userId);
      //Update fcm token
      const deviceInfo = await deviceInfoRepo.findOne({
        user: userId,
        uniqueId: deviceId,
      });
      if (!deviceInfo) {
        return { status: 404, message: 'Device details not found' };
      }
      deviceInfo.fcmToken = data.fcmToken;
      deviceInfo.fcmAspnToken = data.fcmAspnToken;
      await deviceInfo.save();
      return { status: 200, message: 'Token updated successfully' };
    } catch (e) {
      throw e;
    }
  }

  async logout(userId, deviceId) {
    try {
      const deviceInfo = await deviceInfoRepo.findOne({
        user: userId,
        uniqueId: deviceId,
      });
      if (!deviceInfo) {
        return { status: 404, message: 'Device details not found' };
      }
      deviceInfo.fcmToken = '';
      deviceInfo.fcmAspnToken = '';
      await deviceInfo.save();
      return { status: 200, message: 'User logged out' };
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new UserController();
