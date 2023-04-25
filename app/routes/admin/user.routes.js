const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
const multer = require('multer');
const userController = require('../../modules/user/controllers/user.controller');

const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (file.fieldname.match('profile_pic') != null) {
      callback(null, './public/uploads/user/profile_pic');
    } else if (file.fieldname === 'cover_image') {
      callback(null, './public/uploads/user/cover_image');
    } else {
      callback(null, './public/uploads');
    }
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
  },
});

const uploadFile = multer({
  storage: Storage,
});
const request_param = multer();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     AdminUserLoginDTO:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - deviceInfo
 *       properties:
 *         email:
 *           type: string
 *           description: Email address of the user
 *         password:
 *           type: string
 *           description: Password of user
 *         deviceInfo:
 *           type: object
 *           description: Device details of the user
 *       example:
 *         email: user@yopmail.com
 *         password: password
 *         deviceInfo:
 *            uniqueId: "123456789"
 *            deviceName: "iPhone"
 *            systemName: "iOS"
 *            systemVersion: "12.0"
 *
 */

/**
 * @swagger
 * /admin/user/login:
 *   post:
 *     tags:
 *       - Admin User
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserLoginDTO'
 *     responses:
 *       200:
 *         description: The post was successfully created
 *       500:
 *         description: Some server error
 */
namedRouter.post('user.login.process', '/user/login', async (req, res) => {
  try {
    const response = await userController.signin(req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/*
// @Route: Users Forgotpassowrd [Admin]
*/
namedRouter.post(
  'admin.user.forgotpassword',
  '/user/forgotpassword',
  request_param.any(),
  userController.forgotPassword,
);

namedRouter.get('user.logout', '/logout', userController.logout);
namedRouter.all('/profile*', auth.authenticate);

namedRouter.get(
  'admin.profile',
  '/profile/:id',
  request_param.any(),
  userController.viewmyprofile,
);

// admin update profile
namedRouter.post(
  'admin.updateProfile',
  '/profile/update',
  request_param.any(),
  userController.updateprofile,
);

/*
// @Route: Chnage password [Admin] action
*/
namedRouter.post(
  'admin.updateAdminPassword',
  '/profile/update/admin-password',
  request_param.any(),
  userController.adminUpdatePassword,
);

namedRouter.all('/user*', auth.authenticate);
/*
// @Route: Users Dashboard [Admin]
*/
// dashboard route
namedRouter.get('user.dashboard', '/user/dashboard', userController.dashboard);

// Get All Users
namedRouter.post('user.getall', '/user/getall', async (req, res) => {
  try {
    const success = await userController.getAllUser(req, res);
    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

namedRouter.post(
  'user.insert',
  '/user/insert',
  uploadFile.any(),
  userController.insert,
);

// User Edit Route
namedRouter.get('user.edit', '/user/edit/:id', userController.edit);

// User Update Route
namedRouter.post(
  'user.update',
  '/user/update',
  uploadFile.any(),
  userController.update,
);

// User Delete Route
namedRouter.get('user.delete', '/user/delete/:id', userController.delete);

namedRouter.get(
  'user.statusChange',
  '/user/status-change/:id',
  request_param.any(),
  userController.statusChange,
);

namedRouter.get(
  'user.reset-password',
  '/user/reset-password/:id',
  request_param.any(),
  userController.userResetPassword,
);

namedRouter.get(
  'user.user-details',
  '/user/user-details/:id',
  request_param.any(),
  userController.userDetails,
);
// Get All Fans
namedRouter.post('user.fan.getall', '/user/fan/getall', async (req, res) => {
  try {
    const success = await userController.getAllFans(req, res);
    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

namedRouter.post(
  'user.fan.insert',
  '/user/fan/insert',
  uploadFile.any(),
  userController.insertfan,
);

// Fan Edit Route
namedRouter.get('user.fan.edit', '/user/fan/edit/:id', userController.editfan);

// Fan Update Route
namedRouter.post(
  'user.fan.update',
  '/user/fan/update',
  uploadFile.any(),
  userController.updatefan,
);

namedRouter.get(
  'user.fan.statusChange',
  '/user/fan/status-change/:id',
  request_param.any(),
  userController.statusChangeFan,
);

// Fan Delete Route
namedRouter.get(
  'user.fan.delete',
  '/user/fan/delete/:id',
  userController.deletefan,
);

// Get All family
namedRouter.post(
  'user.family.getall',
  '/user/family/getall',
  async (req, res) => {
    try {
      const success = await userController.getAllfamilys(req, res);
      res.send({
        meta: success.meta,
        data: success.data,
      });
    } catch (error) {
      res.status(error.status).send(error);
    }
  },
);

namedRouter.post(
  'user.family.insert',
  '/user/family/insert',
  uploadFile.any(),
  userController.insertfamily,
);

// family Edit Route
namedRouter.get(
  'user.family.edit',
  '/user/family/edit/:id',
  userController.editfamily,
);

// family Update Route
namedRouter.post(
  'user.family.update',
  '/user/family/update',
  uploadFile.any(),
  userController.updatefamily,
);

namedRouter.get(
  'user.family.statusChange',
  '/user/family/status-change/:id',
  request_param.any(),
  userController.statusChangefamily,
);

// Get All Fans
namedRouter.post(
  'user.familymember.getall',
  '/user/familymember/getall/:id/:type',
  async (req, res) => {
    try {
      const success = await userController.getAllFamilyMembers(req, res);
      res.send({
        meta: success.meta,
        data: success.data,
      });
    } catch (error) {
      res.status(error.status).send(error);
    }
  },
);

// family Delete Route
namedRouter.get(
  'user.family.delete',
  '/user/family/delete/:id',
  userController.deletefamily,
);

namedRouter.get(
  'user.familymember.statusChange',
  '/user/familymember/status-change/:parent_id/:type/:id',
  request_param.any(),
  userController.statusChangeFamilyMember,
);

namedRouter.get(
  'user.familymember.delete',
  '/user/familymember/delete/:parent_id/:type/:id',
  request_param.any(),
  userController.deleteFamilyMember,
);

// family Edit Route
namedRouter.get(
  'user.familymember.edit',
  '/user/familymember/edit/:parent_id/:type/:id',
  userController.editfamilymember,
);

// family Update Route
namedRouter.post(
  'user.familymember.update',
  '/user/familymember/update',
  uploadFile.any(),
  userController.updatefamilymember,
);

// Export the express.Router() instance
module.exports = router;
