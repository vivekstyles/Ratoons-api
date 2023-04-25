const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const multer = require('multer');
const userController = require('../../modules/webservice/user.controller');
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
 *     UserSignUpDTO:
 *       type: object
 *       properties:
 *         register_type:
 *           type: string
 *           enum: [facebook, google, apple]
 *           description: Register type of the user
 *         social_id:
 *           type: string
 *           description: Social id of the user
 *         full_name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           description: Email address of the user
 *         profile_pic:
 *           type: file
 *           format: binary
 *           description: Profile pic of user
 *         password:
 *           type: string
 *           description: Password of user
 *         phone:
 *           type: integer
 *           descripton: Phone number of user
 *         deviceInfo:
 *           type: object
 *           description: Device details of the user
 *         inviteCode:
 *           type: string
 *           description: Invite code for user
 *       example:
 *         full_name: Full Name
 *         email: user@yopmail.com
 *         password: password
 *         phone: 7787987987
 *         register_type: facebook|apple|google
 *         social_id: 123456789
 *         deviceInfo:
 *            uniqueId: "123456789"
 *            deviceName: "iPhone"
 *            systemName: "iOS"
 *            systemVersion: "12.0"
 *     UserPostDTOResponse:
 *       type: object
 *       example:
 *         full_name: Full Name
 *         email: user@yopmail.com
 *         password: password
 *         phone: 7787987987
 *     UserLoginDTO:
 *       type: object
 *       required:
 *         - register_type
 *         - social_id
 *         - email
 *         - full_name
 *         - deviceInfo
 *       properties:
 *         register_type:
 *           type: string
 *           enum: [facebook, google, apple]
 *           description: Register type of the user *
 *         social_id:
 *           type: string
 *           description: Social id of the user
 *         full_name:
 *           type: string
 *           description: Full name of the user
 *         phone:
 *           type: integer
 *           description: Pnone number of the user
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
 *         register_type: facebook|google|apple
 *         social_id: 121263766547
 *         full_name: Full Name
 *         phone: 7787987987
 *         email: user@yopmail.com
 *         password: password
 *         deviceInfo:
 *            uniqueId: "123456789"
 *            deviceName: "iPhone"
 *            systemName: "iOS"
 *            systemVersion: "12.0"
 *     ForgotPasswordDTO:
 *       type: object
 *       required:
 *         - type
 *         - value
 *       properties:
 *         type:
 *           type: string
 *           enum: [email, phone]
 *           description: email or phone
 *         value:
 *           type: string
 *           description: email or phone no.
 *       example:
 *         value: user@yopmail.com
 *         type: email
 *     ChangePasswordDTO:
 *       type: object
 *       required:
 *         - old_password
 *         - new_password
 *       properties:
 *         old_password:
 *           type: string
 *           description: Old password of the user
 *         new_password:
 *           type: string
 *           description: Old password of the user
 *       example:
 *         old_password: password
 *         new_password: password
 *     ResetPasswordDTO:
 *       type: object
 *       required:
 *         - token
 *         - new_password
 *       properties:
 *         token:
 *           type: string
 *           description: Reset password token shared on email
 *         new_password:
 *           type: string
 *           description: New password of the user
 *       example:
 *         token: b7858890-1960-11ed-8e7f-a3e7eaf88575
 *         new_password: password
 *     UserUpdateDTO:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *           description: Full name of the user
 *         phone:
 *           type: integer
 *           description: Pnone number of the user
 *         profile_pic:
 *           type: file
 *           format: binary
 *           description: Profile pic of user
 *         push_notification:
 *           type: boolean
 *         email_notification:
 *           type: boolean
 *         sms_notification:
 *           type: boolean
 *         color_theme:
 *           type: string
 *       example:
 *         full_name: Full Name
 *         color_theme: light
 *         phone: 7787987987
 *         profile_pic: <image buffer>
 *         push_notification: false
 *         email_notification: false
 *         sms_notification: false
 *     UserFanInviteDTO:
 *       type: object
 *       required:
 *         - full_name
 *         - email
 *         - phone
 *       properties:
 *         full_name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           description: Email address of the user
 *         phone:
 *           type: integer
 *           descripton: Phone number of user
 *       example:
 *         full_name: Full Name
 *         email: user@yopmail.com
 *         phone: 7787987987
 *     UserInviteDTO:
 *       type: object
 *       required:
 *         - full_name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         full_name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           description: Email address of the user
 *         phone:
 *           type: integer
 *           descripton: Phone number of user
 *         role:
 *           type: string
 *           enum: [fan, creator]
 *           descripton: User role
 *         athletic_id:
 *           type: integer
 *           descripton: Athletic id of user
 *       example:
 *         full_name: Full Name
 *         email: user@yopmail.com
 *         phone: 7787987987
 *         role: creator|fan
 *         athletic_id: 615ff1f1a1aa39b755c5cb1b
 *     CheckUserDto:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [email, social_id]
 *           description: Email or social id
 *         value:
 *           type: string
 *           description: Email id or social id of the user account
 *       example:
 *         type: email
 *         value: user@yopmail.com
 *     UserUpdateFCMTokenDto:
 *       type: object
 *       required:
 *         - fcmToken
 *         - fcmAspnToken
 *       properties:
 *         fcmToken:
 *           type: string
 *           description: FCM token
 *         fcmAspnToken:
 *           type: string
 *           description: FCM Aspn token
 *       example:
 *         fcmToken: token-string
 *         fcmAspnToken: token-string
 */

/**
 * @swagger
 *  tags:
 *    name: User
 *    description: User management
 */

/**
 * @swagger
 * /api/user/check-user:
 *   post:
 *     tags:
 *       - User
 *     summary: Check user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckUserDto'
 *     responses:
 *       200:
 *         description: Returns user exists or not
 */
namedRouter.post(
  'api.user.checkuser',
  '/user/check-user',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.checkUser(req);
      res.status(success.status || 500).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     tags:
 *       - User
 *     summary: User signup
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UserSignUpDTO'
 *     responses:
 *       200:
 *         description: The post was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPostDTOResponse'
 *     500:
 *         description: Some server error
 */
namedRouter.post(
  'api.user.signup',
  '/user/signup',
  request_param.single('profile_pic'),
  async (req, res) => {
    try {
      console.log(req.body)
      const success = await userController.register(req);
      res.status(success.status || 500).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginDTO'
 *     responses:
 *       200:
 *         description: The post was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPostDTOResponse'
 *       500:
 *         description: Some server error
 */
namedRouter.post(
  'api.user.login',
  '/user/login',
  request_param.single('profile_pic'),
  async (req, res) => {
    try {
      const success = await userController.login(req, res);
      res.status(success.status || 500).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     tags:
 *       - User
 *     summary: Generates forgot password link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordDTO'
 *     responses:
 *       200:
 *         description: Valid User.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPostDTOResponse'
 *       201:
 *         description: Your account is deleted|inactive. (Or) No user found.
 *
 */
namedRouter.post(
  'api.user.forgotPassword',
  '/user/forgot-password',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.forgotPassword(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/verify-token:
 *   post:
 *     tags:
 *       - User
 *     summary: Verify forgot password token token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              token:
 *                type: string
 *             example:
 *              token: b7858890-1960-11ed-8e7f-a3e7eaf88575
 *     responses:
 *       200:
 *         description: Verifies forgot password token.
 *         content:
 *           application/json:
 *             schema:
 *               message: Token verified successfully.
 *       201:
 *         description: Token is not verified.
 *
 */
namedRouter.post(
  'api.user.verifyToken',
  '/user/verify-token',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.verifyToken(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     tags:
 *       - User
 *     summary: Resets password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordDTO'
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               message: 'Your password has been updated successfully.'
 *       201:
 *         description: Token is not verified.
 *
 */
namedRouter.post(
  'api.user.resetPassword',
  '/user/reset-password',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.resetPassword(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

// namedRouter.get("api.user.logout", '/user/logout/:id', request_param.any(), async (req, res) => {
//     try {
//         const success = await userController.logout(req, res);
//         res.status(success.status).send(success);
//     } catch (error) {
//         res.status(error.status).send(error);
//     }
// });

namedRouter.all('/user*', auth.authenticateAPI);

/**
 * @swagger
 * /api/user/send-otp/{send_to}:
 *   get:
 *     tags:
 *       - User
 *     summary: Send otp to user email and phone
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in : path
 *         name: send_to
 *         description: email|sms|all
 *         enum: [email, sms, all]
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Send otp to user email and phone
 */
namedRouter.get(
  'api.user.sendotp',
  '/user/send-otp/:send_to',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.sendOTP(
        req.user,
        req.params.send_to,
      );
      res.status(success.status || 500).send(success);
    } catch (e) {
      console.log('Error in send-otp route', e);
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/verify-otp:
 *   post:
 *     tags:
 *       - User
 *     summary: Verify otp sent to user email and phone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              email:
 *                type: string
 *              sms:
 *                type: string
 *             example:
 *              email: "785889"
 *              sms: "785889"
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Send otp to user email and phone
 */
namedRouter.post(
  'api.user.verifyotp',
  '/user/verify-otp',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.verifyOTP(req.user, req.body);
      res.status(success.status || 500).send(success);
    } catch (e) {
      console.log('Error in verify-otp route', e);
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/changePassword:
 *   post:
 *     tags:
 *       - User
 *     summary: Update user password
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordDTO'
 *     responses:
 *       200:
 *         description: Valid User.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPostDTOResponse'
 */
namedRouter.post(
  'api.user.changePassword',
  '/user/changePassword',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.changePassword(req, res);
      res.status(success.status || 500).send(success);
    } catch (e) {
      console.log('Error in change password', e);
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/profile/get:
 *   get:
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - User
 *     summary: Get current user profile details
 *     responses:
 *       401:
 *         description: UnAuthorized|Invalid Token
 *       200:
 *         description: Profile fetched successfully..
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPostDTOResponse'
 */
namedRouter.get(
  'api.user.profile.get',
  '/user/profile/get',
  async (req, res) => {
    try {
      const success = await userController.getProfile(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/profile/update:
 *   post:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Update user profile
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateDTO'
 *     responses:
 *       200:
 *         description: Valid User.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPostDTOResponse'
 */
namedRouter.post(
  'api.user.profile.update',
  '/user/profile/update',
  request_param.single('profile_pic'),
  async (req, res) => {
    try {
      const success = await userController.UpdateProfile(req, res);
      res.status(success.status || 500).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/fan/invite:
 *   post:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Invite a user to join the app as a fan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserFanInviteDTO'
 *     responses:
 *       200:
 *         description: Fan Invite sent successfully.
 */
namedRouter.post(
  'api.user.fan.invite',
  '/user/fan/invite',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.faninvite(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Invite a user to join the app
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInviteDTO'
 *     responses:
 *       200:
 *         description: Invitation sent successfully.
 */
namedRouter.post(
  'api.user.invite',
  '/user/invite',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.sendInvitation(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/invitation/pending/list:
 *   get:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Get pending invitations list for the user
 *     parameters:
 *       - in : query
 *         name: role
 *         description: fan|creator|athelectic_fan
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invitation fetched successfully.
 */
namedRouter.get(
  'api.user.invitation.pending.list',
  '/user/invitation/pending/list',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.pendingInvitation(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/invitation/accept:
 *   post:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Accept an invitation
 *     parameters:
 *       - in : path
 *         name: role
 *         description: fan|creator|athelectic_fan
 *         schema:
 *           type: string
 *         required: true
 *       - in : path
 *         name: atheletic_id
 *         description: atheletic id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Athelectic Fan Invitation accepted fetched successfully.
 */
namedRouter.post(
  'api.user.invitation.accept',
  '/user/invitation/accept',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.acceptInvitation(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/delete/{user_id}:
 *   delete:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Delete a user created by the current user
 *     parameters:
 *       - in : path
 *         name: user_id
 *         description: user_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Fan deleted successfully.
 */
namedRouter.delete(
  'api.user.delete',
  '/user/delete/:user_id',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await userController.userDelete(req, res);
      res.status(success.status).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/update-fcm-token/{deviceId}:
 *   post:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Update fcm token
 *     parameters:
 *       - in : path
 *         name: deviceId
 *         description: Device id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateFCMTokenDto'
 *     responses:
 *       200:
 *         description: Updated user fcm token.
 */
namedRouter.post(
  'api.user.updateToken',
  '/user/update-fcm-token/:deviceId',
  async (req, res) => {
    try {
      const response = await userController.updateFCMToken(
        req.user._id,
        req.params.deviceId,
        req.body,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/user/logout/{deviceId}:
 *   post:
 *     tags:
 *       - User
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Logout user
 *     parameters:
 *       - in : path
 *         name: deviceId
 *         description: Device id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Logout user
 */
namedRouter.post(
  'api.user.logout',
  '/user/logout/:deviceId',
  async (req, res) => {
    try {
      const response = await userController.logout(
        req.user._id,
        req.params.deviceId,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);
// Export the express.Router() instance
module.exports = router;
