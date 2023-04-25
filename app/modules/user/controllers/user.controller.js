const mongoose = require('mongoose');
const User = require('user/models/user.model');
const userRepo = require('../../user/repositories/user.repository');
const roleRepo = require('role/repositories/role.repository');
const faqRepo = require('faq/repositories/faq.repository');
const sportRepo = require('sport/repositories/sport.repository');
const athleteRepo = require('athlete/repositories/athlete.repository');
const mailer = require('../../../helper/mailer.js');
const helper = require('../../../helper/helper.js');
const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
var worldMapData = require('city-state-country');
const gm = require('gm').subClass({
  imageMagick: true,
});
const fs = require('fs');
const jwt = require('jsonwebtoken');
//mail send
const { join } = require('path');
const ejs = require('ejs');
const { readFile } = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(readFile);
var request = require('request');
const { concatSeries } = require('async');

class UserController {
  constructor() {
    this.users = [];
  }

  /* @Method: signin
    // @Description: user Login
    */
  async signin(params) {
    try {
      let user = await userRepo.fineOneWithRole(params.email);
      if (!user) {
        return { status: 404, message: 'User not found.' };
      }
      if (!user.validPassword(params.password, user.password)) {
        return { status: 400, message: 'Invalid username or password' };
      }
      if (user.role && user.role.role !== 'admin') {
        return { status: 400, message: 'You are not an admin user.' };
      }
      const payload = {
        id: user._id,
        deviceId: params.deviceInfo.uniqueId,
        role: user.role.role,
      };
      const token = jwt.sign(payload, config.jwtSecret, {});
      return {
        status: 200,
        data: user,
        token: token,
        message: 'You have successfully logged in',
      };
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  /* @Method: insert
   // @Description: save User
   */
  async insert(req, res) {
    try {
      let roleDetails = await roleRepo.getByField({ role: 'creator' });
      if (!_.isEmpty(roleDetails)) {
        req.body.role = roleDetails._id;
      }
      let password = req.body.password;
      const newUser = new User();

      req.body.password = newUser.generateHash(req.body.password);
      var chk = { isDeleted: false, email: req.body.email };
      let checkEmail = await userRepo.getByField(chk);
      if (_.isEmpty(checkEmail)) {
        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );
                req.body.profile_pic = req.files[i].filename;
              } else if (req.files[i].fieldname == 'cover_image') {
                gm('public/uploads/user/cover_image/' + req.files[i].filename)
                  .resize(150)
                  .write(
                    'public/uploads/user/cover_image/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );
                req.body.cover_image = req.files[i].filename;
              }
            }
          }
        }

        let userData = await userRepo.save(req.body);
        if (!_.isEmpty(userData)) {
          let locals = {
            full_name: userData.full_name,
            email: req.body.email,
            password: password,
            role: SocialKeeper,
            site_title: 'Social Score Keeper', //settingObj.Site_Title
          };
          await mailer.sendMail(
            `Admin<${process.env.MAIL_USERNAME}>`,
            req.body.email,
            'Welcome!',
            'registration',
            locals,
          );
          res.status(200).send({
            data: userData,
            message:
              'Welcome message has been sent to your registered email Id.',
          });
        } else {
          res.status(500).send({ message: 'Somethig went wrong!' });
        }
      } else {
        res
          .status(409)
          .send({ message: 'Sorry, User already exist with this email.' });
      }
    } catch (e) {
      console.log(e.message);
      res.status(500).send({ message: error.message });
    }
  }

  /* @Method: getAllUser
    // @Description: To get all the user from DB
    */
  async getAllUser(req, res) {
    try {
      req.body.role = 'creator';
      if (_.has(req.body, 'sort')) {
        var sortOrder = req.body.sort.sort;
        var sortField = req.body.sort.field;
      } else {
        var sortOrder = -1;
        var sortField = '_id';
      }

      if (!_.has(req.body, 'pagination')) {
        req.body.pagination.page = 1;
        req.body.pagination.perpage = config.PAGINATION_PERPAGE;
      }

      let user = await userRepo.getAllUsers(req);

      let meta = {
        page: user.page,
        pages: user.pages,
        perpage: req.body.pagination.perpage,
        total: user.total,
        sort: sortOrder,
        field: sortField,
      };

      return {
        status: 200,
        meta: meta,
        data: user.docs,
        message: 'Data fetched successfully.',
      };
    } catch (e) {
      return { status: 500, data: [], message: e.message };
    }
  }

  /**
   * @Method: edit
   * @Description: To edit user information
   */
  async edit(req, res) {
    try {
      let userData = await userRepo.getById(req.params.id);

      if (!_.isEmpty(userData)) {
        res.status(200).send({
          data: userData,
          message: 'Data fetched successfully.',
        });
      } else {
        res.status(404).send({ message: 'Sorry record not found!' });
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }

  async update(req, res) {
    try {
      var chkEmail = {
        isDeleted: false,
        email: req.body.email,
        _id: { $ne: mongoose.Types.ObjectId(req.body.uid) },
      };
      let checkEmail = await userRepo.getByField(chkEmail);
      if (!_.isEmpty(checkEmail)) {
        res.status(409).send({ message: 'Email already exist.' });
      } else {
        let userData = await userRepo.getById(req.body.uid);

        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                if (userData.profile_pic != '') {
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    )
                  ) {
                    const delImg = fs.unlinkSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    );
                  }
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    )
                  ) {
                    const delThumb = fs.unlinkSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    );
                  }
                }

                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );

                req.body.profile_pic = req.files[i].filename;
              }
            }
          }
        }

        let userUpdate = await userRepo.updateById(req.body, req.body.uid);
        if (userUpdate) {
          res
            .status(200)
            .send({ data: userUpdate, message: 'User updated successfully.' });
        }
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }

  /* @Method: delete
    // @Description: user Delete
    */
  async delete(req, res) {
    try {
      let userDelete = await userRepo.updateById(
        {
          isDeleted: true,
        },
        req.params.id,
      );
      if (!_.isEmpty(userDelete)) {
        res.status(200).send({ message: 'User Removed Successfully' });
      } else {
        res
          .status(500)
          .send({ message: 'Unable to remove user at this moment' });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  async generateRandomString(length) {
    try {
      var text = '';
      var possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    } catch (e) {
      console.log(e.message);
    }
  }

  /* @Method: Dashboard
    // @Description: User Dashboard
    */
  async dashboard(req, res) {
    try {
      let user = await userRepo.getLimitUserByField({
        isDeleted: false,
        'role.role': 'admin',
      });
      var resultAll = {
        user: user,
        totalUserCount: 0,
        activeUserCount: 0,
        totalFansCount: 0,
        activeFansCount: 0,
        totalSportCount: 0,
        activeSportCount: 0,
        totalFaqCount: 0,
        activeFaqCount: 0,
        totalAthleteCount: 0,
        activeAthleteCount: 0,
      };

      let roleUser = await roleRepo.getByField({ role: 'creator' });
      let roleFan = await roleRepo.getByField({ role: 'fan' });
      // User Summary
      let totalUserCount = await userRepo.getUserCountByParam({
        isDeleted: false,
        role: mongoose.Types.ObjectId(roleUser._id),
      });
      if (totalUserCount != null && totalUserCount != 0) {
        resultAll.totalUserCount = totalUserCount;
      }

      let activeUserCount = await userRepo.getUserCountByParam({
        status: 'Active',
        isDeleted: false,
        role: mongoose.Types.ObjectId(roleUser._id),
      });
      if (activeUserCount != null && activeUserCount != 0) {
        resultAll.activeUserCount = activeUserCount;
      }

      // Fans Summary
      let totalFansCount = await userRepo.getUserCountByParam({
        isDeleted: false,
        role: mongoose.Types.ObjectId(roleFan._id),
      });
      if (totalFansCount != null && totalFansCount != 0) {
        resultAll.totalFansCount = totalFansCount;
      }

      let activeFansCount = await userRepo.getUserCountByParam({
        status: 'Active',
        isDeleted: false,
        role: mongoose.Types.ObjectId(roleFan._id),
      });
      if (activeFansCount != null && activeFansCount != 0) {
        resultAll.activeFansCount = activeFansCount;
      }

      // Sport Summary
      let totalSportCount = await sportRepo.getSportCount({ isDeleted: false });
      if (totalSportCount != null && totalSportCount != 0) {
        resultAll.totalSportCount = totalSportCount;
      }

      let activeSportCount = await sportRepo.getSportCount({
        status: 'Active',
        isDeleted: false,
      });
      if (activeSportCount != null && activeSportCount != 0) {
        resultAll.activeSportCount = activeSportCount;
      }

      // Athlete count
      let totalAthleteCount = await athleteRepo.getAthleteCount({
        isDeleted: false,
      });
      if (totalAthleteCount != null && totalAthleteCount != 0) {
        resultAll.totalAthleteCount = totalAthleteCount;
      }

      let activeAthleteCount = await athleteRepo.getAthleteCount({
        status: 'Active',
        isDeleted: false,
      });
      if (activeAthleteCount != null && activeAthleteCount != 0) {
        resultAll.activeAthleteCount = activeAthleteCount;
      }

      // Faq Summary
      let totalFaqCount = await faqRepo.getFaqCount({ isDeleted: false });

      if (totalFaqCount != null && totalFaqCount != 0) {
        resultAll.totalFaqCount = totalFaqCount;
      }

      let activeFaqCount = await faqRepo.getFaqCount({
        status: 'Active',
        isDeleted: false,
      });
      if (activeFaqCount != null && activeFaqCount != 0) {
        resultAll.activeFaqCount = activeFaqCount;
      }

      res.status(200).send({
        data: resultAll,
        message: 'User Dashboard',
      });
    } catch (e) {
      console.log(e.message);
      return res.status(500).send({ message: e.message });
    }
  }

  /* @Method: Logout
    // @Description: User Logout
    */
  async logout(req, res) {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
    // req.session.token = "";
    // req.session.destroy();
    // return res.redirect('/');
  }

  /* @Method: viewmyprofile
    // @Description: To get Profile Info from db
    */
  async viewmyprofile(req, res) {
    try {
      const id = req.params.id;
      let user = await userRepo.getById(id);
      if (!_.isEmpty(user)) {
        res.status(200).send({
          data: user,
          message: 'User Profile',
        });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /* @Method: updateprofile
    // @Description: Update My Profile
    */
  async updateprofile(req, res) {
    try {
      const id = req.body.id;
      let userUpdate = await userRepo.updateById(req.body, id);
      if (!_.isEmpty(userUpdate)) {
        res.status(200).send({
          data: userUpdate,
          message: 'Profile updated successfully.',
        });
      } else {
        res.status(500).send({
          message: 'Something went wrong.',
        });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: status_change
    // @Description: User status change action
    */
  async statusChange(req, res) {
    try {
      let user = await userRepo.getById(req.params.id);
      if (!_.isEmpty(user)) {
        let userStatus = user.status == 'Active' ? 'Inactive' : 'Active';
        let updateStatus = await userRepo.updateById(
          {
            status: userStatus,
          },
          req.params.id,
        );
        if (updateStatus) {
          res.status(200).send({
            data: updateStatus,
            message: 'User status has changed successfully.',
          });
        } else {
          res.status(500).send({
            message: 'Something went wrong, please try later.',
          });
        }
      } else {
        res.status(404).send({
          message: 'Sorry user not found',
        });
      }
    } catch (e) {
      console.log(e.message);
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: updatepassword
    // @Description: User password change
    */

  async adminUpdatePassword(req, res) {
    try {
      let user = await userRepo.getById(req.user._id);
      if (!_.isEmpty(user)) {
        // check if password matches
        if (!user.validPassword(req.body.old_password, user.password)) {
          res.status(400).send({
            message: 'Sorry old password mismatch!',
          });
        } else {
          if (req.body.password == req.body.password_confirm) {
            // if user is found and password is right, check if he is an admin
            let new_password = req.user.generateHash(req.body.password);
            let userUpdate = await userRepo.updateById(
              {
                password: new_password,
              },
              req.body.id,
            );

            if (userUpdate) {
              res.status(200).send({
                data: userUpdate,
                message: 'Your password has been changed successfully.',
              });
            }
          } else {
            res.status(400).send({
              message: 'Your New Password And Confirm Password does not match.',
            });
          }
        }
      } else {
        res.status(500).send({
          message: 'Authentication failed. Wrong credentials.',
        });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: forgotPassword
    // @Description: User forgotPassword
    */

  async forgotPassword(req, res) {
    try {
      let roleDetails = await roleRepo.getByField({ role: 'admin' });
      let result = {};
      let user = await User.findOne({
        email: req.body.email,
        role: mongoose.Types.ObjectId(roleDetails._id),
      }).exec();
      if (!user) {
        result.status = 500;
        return res
          .status(201)
          .send({ result: result, message: 'User not found', status: false });
      } else {
        let random_pass = Math.random().toString(36).substr(2, 9);
        let readable_pass = random_pass;
        random_pass = user.generateHash(random_pass);
        let user_details = await User.findByIdAndUpdate(user._id, {
          password: random_pass,
        }).exec();
        if (!user_details) {
          result.status = 500;
          return res
            .status(201)
            .send({ result: result, message: 'User not found', status: false });
        } else {
          const settingObj = await genSettingRepo.getByField({
            isDeleted: false,
          });

          let locals = {
            user_fullname: user.full_name,
            readable_pass: readable_pass,
            site_title: settingObj.site_title,
          };

          let isMailSend = await mailer.sendMail(
            settingObj.site_title + '<' + settingObj.site_email + '>',
            req.body.email,
            'Forget Password',
            'admin-forgot-password',
            locals,
          );

          if (isMailSend) {
            result.status = 200;
            return res.status(200).send({
              result: result,
              message: 'Email is sending to your email id with new password',
              status: false,
            });
          } else {
            result.status = 201;
            return res.status(201).send({
              result: result,
              message: 'Unable to send email at this moment',
              status: false,
            });
          }
        }
      }
    } catch (e) {
      console.log(e.message);
      return res.status(500).send({ message: e.message });
    }
  }

  async getAllUserCount(req, res) {
    try {
      let userCount = await userRepo.getUsersCount(req);
      return userCount;
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  async userResetPassword(req, res) {
    try {
      let user = await userRepo.getById(req.params.id);

      if (!_.isEmpty(user)) {
        let random_pass = Math.random().toString(36).substr(2, 9);
        let readable_pass = random_pass;
        random_pass = user.generateHash(random_pass);
        let user_details = await User.findByIdAndUpdate(user._id, {
          password: random_pass,
        }).exec();
        if (!user_details) {
          res
            .status(500)
            .send({ message: 'Something went wrong, please try later.' });
        } else {
          const settingObj = await genSettingRepo.getByField({
            isDeleted: false,
          });
          let locals = {
            name: user.full_name,
            site_title: settingObj.site_title,
            message:
              'Your password has been successfully reset by site admin. Please login with your new password: ' +
              readable_pass,
          };

          let isMailSend = await mailer.sendMail(
            settingObj.site_title + '<' + settingObj.site_email + '>',
            user.email,
            'Reset Password',
            'reset-password',
            locals,
          );

          if (isMailSend) {
            res
              .status(200)
              .send({ message: 'Password Reset successfully done.' });
          } else {
            res.status(500).send({ message: 'Something wrong to send email.' });
          }
        }
      } else {
        res.status(404).send({ message: 'Sorry user not found' });
      }
    } catch (e) {
      // console.log(e.message);
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  async userDetails(req, res) {
    try {
      let userData = await userRepo.getUserByField({ _id: req.params.id });

      if (!_.isEmpty(userData)) {
        res.status(200).send({
          data: userData,
          message: 'User details found successfully.',
        });
      } else {
        res.status(404).send({ message: 'Sorry user not found' });
      }
    } catch (e) {
      throw e;
    }
  }
  /* @Method: getAllUser
    // @Description: To get all the user from DB
    */
  async getAllFans(req, res) {
    try {
      req.body.role = 'fan';
      if (_.has(req.body, 'sort')) {
        var sortOrder = req.body.sort.sort;
        var sortField = req.body.sort.field;
      } else {
        var sortOrder = -1;
        var sortField = '_id';
      }

      if (!_.has(req.body, 'pagination')) {
        req.body.pagination.page = 1;
        req.body.pagination.perpage = config.PAGINATION_PERPAGE;
      }
      let user = await userRepo.getAllUsers(req);

      let meta = {
        page: user.page,
        pages: user.pages,
        perpage: req.body.pagination.perpage,
        total: user.total,
        sort: sortOrder,
        field: sortField,
      };

      return {
        status: 200,
        meta: meta,
        data: user.docs,
        message: 'Data fetched successfully.',
      };
    } catch (e) {
      return { status: 500, data: [], message: e.message };
    }
  }

  /* @Method: insertfan
   // @Description: save fan
   */
  async insertfan(req, res) {
    try {
      let roleDetails = await roleRepo.getByField({ role: 'fan' });
      let password = req.body.password;
      if (!_.isEmpty(roleDetails)) {
        req.body.role = roleDetails._id;
      }

      const newUser = new User();

      req.body.password = newUser.generateHash(req.body.password);
      let checkEmail = await userRepo.getByField({ email: req.body.email });
      if (_.isEmpty(checkEmail)) {
        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );
                req.body.profile_pic = req.files[i].filename;
              } else if (req.files[i].fieldname == 'cover_image') {
                gm('public/uploads/user/cover_image/' + req.files[i].filename)
                  .resize(150)
                  .write(
                    'public/uploads/user/cover_image/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );
                req.body.cover_image = req.files[i].filename;
              }
            }
          }
        }

        let userData = await userRepo.save(req.body);
        if (!_.isEmpty(userData)) {
          let locals = {
            full_name: userData.full_name,
            email: req.body.email,
            password: password,
            role: roleDetails.roleDisplayName,
            site_title: 'Social Score Keeper', //settingObj.Site_Title
          };
          var isMailSend = await mailer.sendMail(
            `Admin<${process.env.MAIL_USERNAME}>`,
            req.body.email,
            'Welcome!',
            'registration',
            locals,
          );
          res.status(200).send({
            status: 200,
            data: userData,
            message:
              'User created successfully. Welcome message has been sent to your registered email Id.',
          });
        } else {
          res.status(201).send({ message: 'Something went wrong!' });
        }
      } else {
        res
          .status(409)
          .send({ message: 'Sorry, User already exist with this email.' });
      }
    } catch (e) {
      res.status(500).send({ message: error.message });
    }
  }

  /**
   * @Method: editFan
   * @Description: To edit fan information
   */
  async editfan(req, res) {
    try {
      let userData = await userRepo.getById(req.params.id);

      if (!_.isEmpty(userData)) {
        res
          .status(200)
          .send({ data: userData, message: 'User found successfully.' });
      } else {
        res.status(500).send({ message: 'Sorry record not found!' });
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }

  async updatefan(req, res) {
    try {
      var chkEmail = {
        isDeleted: false,
        email: req.body.email,
        _id: { $ne: mongoose.Types.ObjectId(req.body.uid) },
      };
      let checkEmail = await userRepo.getByField(chkEmail);
      if (!_.isEmpty(checkEmail)) {
        res.status(409).send({ message: 'Email already exist.' });
      } else {
        let userData = await userRepo.getById(req.body.uid);

        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                if (userData.profile_pic != '') {
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    )
                  ) {
                    const delImg = fs.unlinkSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    );
                  }
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    )
                  ) {
                    const delThumb = fs.unlinkSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    );
                  }
                }

                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );

                req.body.profile_pic = req.files[i].filename;
              }
            }
          }
        }

        let userUpdate = await userRepo.updateById(req.body, req.body.uid);
        if (userUpdate) {
          res.status(200).send({
            data: userUpdate,
            message: 'Record updated successfully.',
          });
        }
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }

  /* @Method: deletefan
    // @Description: fan Delete
    */
  async deletefan(req, res) {
    try {
      let userDelete = await userRepo.updateById(
        {
          isDeleted: true,
        },
        req.params.id,
      );
      if (!_.isEmpty(userDelete)) {
        res.status(200).send({ message: 'Record removed successfully.' });
      } else {
        res
          .status(500)
          .send({ message: 'Unable to remove user at this moment.' });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: statusChangeFan
    // @Description: Fan status change action
    */
  async statusChangeFan(req, res) {
    try {
      let user = await userRepo.getById(req.params.id);
      if (!_.isEmpty(user)) {
        let userStatus = user.status == 'Active' ? 'Inactive' : 'Active';
        let updateStatus = await userRepo.updateById(
          {
            status: userStatus,
          },
          req.params.id,
        );
        if (updateStatus) {
          res.status(200).send({
            data: updateStatus,
            message: 'User status has changed successfully.',
          });
        } else {
          res.status(500).send({
            message: 'Something went wrong, please try later.',
          });
        }
      } else {
        res.status(404).send({
          message: 'Sorry user not found',
        });
      }
    } catch (e) {
      // console.log(e.message);
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /* @Method: getAllUser
    // @Description: To get all the user from DB
    */
  async getAllfamilys(req, res) {
    try {
      let fanRoleData = await roleRepo.getByField({
        role: 'fan',
      });
      let creatorRoleData = await roleRepo.getByField({
        role: 'creator',
      });

      req.body.role = 'family';
      if (_.has(req.body, 'sort')) {
        var sortOrder = req.body.sort.sort;
        var sortField = req.body.sort.field;
      } else {
        var sortOrder = -1;
        var sortField = '_id';
      }

      if (!_.has(req.body, 'pagination')) {
        req.body.pagination.page = 1;
        req.body.pagination.perpage = config.PAGINATION_PERPAGE;
      }

      let user = await userRepo.getAllFamilyUsers(req);

      for (var i = 0; i < user.total; i++) {
        //query for no of fans
        var fanQuery = {
          isDeleted: false,
          parent_id: mongoose.Types.ObjectId(user.docs[i]._id),
          role: mongoose.Types.ObjectId(fanRoleData._id),
        };
        var fanRecord = await userRepo.getAllByField(fanQuery);

        //query for no of creator
        var creatorQuery = {
          isDeleted: false,
          parent_id: mongoose.Types.ObjectId(user.docs[i]._id),
          role: mongoose.Types.ObjectId(creatorRoleData._id),
        };
        var creatorRecord = await userRepo.getAllByField(creatorQuery);

        user.docs[i].fan_record = fanRecord.length;
        user.docs[i].creator_record = creatorRecord.length;
      }

      let meta = {
        page: user.page,
        pages: user.pages,
        perpage: req.body.pagination.perpage,
        total: user.total,
        sort: sortOrder,
        field: sortField,
      };

      return {
        status: 200,
        meta: meta,
        data: user.docs,
        message: 'Data fetched successfully.',
      };
    } catch (e) {
      return { status: 500, data: [], message: e.message };
    }
  }

  /* @Method: insertfamily
   // @Description: save family
   */
  async insertfamily(req, res) {
    try {
      let roleDetails = await roleRepo.getByField({ role: 'family' });
      if (!_.isEmpty(roleDetails)) {
        req.body.role = roleDetails._id;
      }
      let password = req.body.password;
      const newUser = new User();

      req.body.password = newUser.generateHash(req.body.password);
      var chk = { isDeleted: false, email: req.body.email };
      let checkEmail = await userRepo.getByField(chk);

      if (_.isEmpty(checkEmail)) {
        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );
                req.body.profile_pic = req.files[i].filename;
              } else if (req.files[i].fieldname == 'cover_image') {
                gm('public/uploads/user/cover_image/' + req.files[i].filename)
                  .resize(150)
                  .write(
                    'public/uploads/user/cover_image/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );
                req.body.cover_image = req.files[i].filename;
              }
            }
          }
        }

        let userData = await userRepo.save(req.body);

        if (!_.isEmpty(userData)) {
          let locals = {
            full_name: userData.full_name,
            email: req.body.email,
            password: password,
            role: roleDetails.roleDisplayName,
            site_title: 'Social Score Keeper', //settingObj.Site_Title
          };
          var isMailSend = await mailer.sendMail(
            `Admin<${process.env.MAIL_USERNAME}>`,
            req.body.email,
            'Welcome!',
            'registration',
            locals,
          );
          res.status(200).send({
            data: userData,
            message:
              'Welcome message has been sent to your registered email Id.',
          });
        } else {
          res.status(500).send({ data: {}, message: 'Somethig went wrong!' });
        }
      } else {
        res.status(404).send({
          message: 'Sorry, User already exist with this email.',
        });
      }
    } catch (e) {
      res.status(500).send({ message: error.message });
    }
  }

  /**
   * @Method: editfamily
   * @Description: To edit family information
   */
  async editfamily(req, res) {
    try {
      let userData = await userRepo.getById(req.params.id);

      if (!_.isEmpty(userData)) {
        res.status(200).send({
          data: userData,
          message: 'Data fetched successfully.',
        });
      } else {
        res.status(404).send({ message: 'Sorry record not found!' });
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }
  async updatefamily(req, res) {
    try {
      var chkEmail = {
        isDeleted: false,
        email: req.body.email,
        _id: { $ne: mongoose.Types.ObjectId(req.body.uid) },
      };
      let checkEmail = await userRepo.getByField(chkEmail);
      if (!_.isEmpty(checkEmail)) {
        res.status(404).send({ message: 'Email already exist.' });
      } else {
        let userData = await userRepo.getById(req.body.uid);

        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                if (userData.profile_pic != '') {
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    )
                  ) {
                    const delImg = fs.unlinkSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    );
                  }
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    )
                  ) {
                    const delThumb = fs.unlinkSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    );
                  }
                }

                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );

                req.body.profile_pic = req.files[i].filename;
              }
            }
          }
        }

        let userUpdate = await userRepo.updateById(req.body, req.body.uid);
        if (userUpdate) {
          res.status(200).send({ message: 'Record updated successfully.' });
        }
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }

  async getAllFamilyMembers(req, res) {
    try {
      req.body.parent_id = req.params.id;
      req.body.role = req.params.type;

      let childData = await userRepo.getAllFamilyMembers(req);
      if (_.has(req.body, 'sort')) {
        var sortOrder = req.body.sort.sort;
        var sortField = req.body.sort.field;
      } else {
        var sortOrder = -1;
        var sortField = '_id';
      }

      let meta = {
        page: childData.page,
        pages: childData.pages,
        perpage: req.body.pagination.perpage,
        total: childData.total,
        sort: sortOrder,
        field: sortField,
      };

      return {
        status: 200,
        meta: meta,
        data: childData.docs,
        message: `Data fetched succesfully.`,
      };
    } catch (e) {
      throw e;
    }
  }

  /* @Method: deletefamily
    // @Description: family Delete
    */
  async deletefamily(req, res) {
    try {
      let userDelete = await userRepo.updateById(
        {
          isDeleted: true,
        },
        req.params.id,
      );
      if (!_.isEmpty(userDelete)) {
        res.status(200).send({ message: 'Record removed successfully.' });
      } else {
        res
          .status(500)
          .send({ message: 'Unable to remove user at this moment.' });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: statusChangefamily
    // @Description: family status change action
    */
  async statusChangefamily(req, res) {
    try {
      let user = await userRepo.getById(req.params.id);
      if (!_.isEmpty(user)) {
        let userStatus = user.status == 'Active' ? 'Inactive' : 'Active';
        let updateStatus = await userRepo.updateById(
          {
            status: userStatus,
          },
          req.params.id,
        );
        if (updateStatus) {
          res.status(200).send({
            data: updateStatus,
            message: 'User status has changed successfully.',
          });
        } else {
          res
            .status(500)
            .send({ message: 'Something went wrong, please try later.' });
        }
      } else {
        res.status(500).send({ message: 'Sorry user not found' });
      }
    } catch (e) {
      // console.log(e.message);
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: statusChangeFamilyMember
    // @Description: status change action
    */
  async statusChangeFamilyMember(req, res) {
    try {
      let user = await userRepo.getById(req.params.id);
      if (!_.isEmpty(user)) {
        let userStatus = user.status == 'Active' ? 'Inactive' : 'Active';
        let updateStatus = await userRepo.updateById(
          { status: userStatus },
          req.params.id,
        );
        if (updateStatus) {
          res.status(200).send({
            data: updateStatus,
            message: 'User status has changed successfully.',
          });
        } else {
          res
            .status(500)
            .send({ message: 'Something went wrong, please try later.' });
        }
      } else {
        res.status(404).send({ message: 'Sorry user not found' });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: deleteFamilyMember
    // @Description: Delete Family Member
    */
  async deleteFamilyMember(req, res) {
    try {
      let userDelete = await userRepo.updateById(
        {
          isDeleted: true,
        },
        req.params.id,
      );

      if (userDelete) {
        res.status(200).send({ message: 'User deleted successfully.' });
      } else {
        res
          .status(500)
          .send({ message: 'Something went wrong, please try later.' });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /**
   * @Method: editfamilymember
   * @Description: To edit family member information
   */
  async editfamilymember(req, res) {
    try {
      let userData = await userRepo.getById(req.params.id);

      if (!_.isEmpty(userData)) {
        var result = {};

        result.user_data = userData;
        result.parent_id = req.params.parent_id;
        result.type = req.params.type;

        res.status(200).send({
          data: result,
          message: 'Family member data fetched successfully.',
        });
      } else {
        res.status(404).send({
          message: 'Sorry record not found!',
        });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  async updatefamilymember(req, res) {
    try {
      var chkEmail = {
        isDeleted: false,
        email: req.body.email,
        _id: { $ne: mongoose.Types.ObjectId(req.body.uid) },
      };
      let checkEmail = await userRepo.getByField(chkEmail);
      if (!_.isEmpty(checkEmail)) {
        res.status(409).send({
          message: 'Email already exist.',
        });
      } else {
        let userData = await userRepo.getById(req.body.uid);

        if (_.has(req, 'files')) {
          if (req.files.length > 0) {
            for (var i = 0; i < req.files.length; i++) {
              if (req.files[i].fieldname == 'profile_pic') {
                if (userData.profile_pic != '') {
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    )
                  ) {
                    const delImg = fs.unlinkSync(
                      'public/uploads/user/profile_pic/' + userData.profile_pic,
                    );
                  }
                  if (
                    fs.existsSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    )
                  ) {
                    const delThumb = fs.unlinkSync(
                      'public/uploads/user/profile_pic/thumb/' +
                        userData.profile_pic,
                    );
                  }
                }

                gm('public/uploads/user/profile_pic/' + req.files[i].filename)
                  .resize(100)
                  .write(
                    'public/uploads/user/profile_pic/thumb/' +
                      req.files[i].filename,
                    function (err) {
                      if (err) req.flash('error', err.message);
                    },
                  );

                req.body.profile_pic = req.files[i].filename;
              }
            }
          }
        }

        let userUpdate = await userRepo.updateById(req.body, req.body.uid);
        if (userUpdate) {
          res.status(200).send({
            data: userUpdate,
            message: 'Record updated successfully.',
          });
        } else {
          res.status(500).send({
            message: 'Record not updated. Please try again later.',
          });
        }
      }
    } catch (e) {
      res.status(500).send({
        message: e.message,
      });
    }
  }
}

module.exports = new UserController();
