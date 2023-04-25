const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const inviteController = require('../../modules/invites/controllers/invites.controller');
const notificationController = require('../../modules/notifications/controllers/notifications.controller');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     SendInviteDto:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Invite to be sent via email or sms
 *           enum: [email, sms]
 *         inviteType:
 *           type: string
 *           enum: [partner, fan]
 *           description: Invite for partner or fan
 *         email:
 *           type: string
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *     UpdateInviteDto:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: True or false
 *       example:
 *         status: true
 *     GetInviteDto:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, accepted]
 *           description: Invite status
 *         type:
 *           type: string
 *           enum: [sent, received]
 *           description: Invite type
 *       example:
 *         status: pending
 */
namedRouter.all('/invite*', auth.authenticateAPI);

/**
 * @swagger
 * /api/invite/get-link/{inviteType}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Generates a link for invite
 *     tags:
 *       - Invites
 *     parameters:
 *       - in : path
 *         name: inviteType
 *         description: Invite type
 *         schema:
 *           type: string
 *           enum: [partner, fan]
 *         required: true
 *     responses:
 *       200:
 *         description: Invite link generated successfully.
 */
namedRouter.get(
  'api.invite.get-link',
  '/invite/get-link/:inviteType',
  async (req, res) => {
    try {
      const response = await inviteController.getInviteLink(
        req.user,
        req.params.inviteType,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/invite:
 *   post:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Send invite via email or sms
 *     tags:
 *       - Invites
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/SendInviteDto'
 *     responses:
 *       200:
 *         description: Invite sent successfully.
 */
namedRouter.post('api.invite', '/invite', async (req, res) => {
  try {
    const response = await inviteController.sendInvite(req.user, req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /api/invite/{inviteId}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Accept or reject invite
 *     tags:
 *       - Invites
 *     parameters:
 *       - in : path
 *         name: inviteId
 *         description: Invite Id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/UpdateInviteDto'
 *     responses:
 *       200:
 *         description: Invite updated successfully.
 */
namedRouter.put('api.invite.update', '/invite/:inviteId', async (req, res) => {
  try {
    const response = await inviteController.respondToPartnerInvite(
      req.user,
      req.body.status,
      req.params.inviteId,
    );
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /api/invite/{inviteId}/approval:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Accept or reject invite
 *     tags:
 *       - Invites
 *     parameters:
 *       - in : path
 *         name: inviteId
 *         description: Invite Id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/UpdateInviteDto'
 *     responses:
 *       200:
 *         description: Invite updated successfully.
 */

namedRouter.put(
  'api.invite.approval',
  '/invite/:inviteId/approval',
  async (req, res) => {
    try {
      const response = await inviteController.inviteApproval(
        req.user,
        req.body.status,
        req.params.inviteId,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/invite/{inviteId}/cancel:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Cancel sent invite
 *     tags:
 *       - Invites
 *     parameters:
 *       - in : path
 *         name: inviteId
 *         description: Invite Id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invite cancelled successfully.
 */
namedRouter.put(
  'api.invite.cancel',
  '/invite/:inviteId/cancel',
  async (req, res) => {
    try {
      const response = await inviteController.cancelInvite(
        req.user,
        req.params.inviteId,
      );
      //Remove notification for user
      if (response.data?.user) {
        await notificationController.deleteNotification(req.params.inviteId);
      }
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/invite:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get invites sent or received
 *     tags:
 *       - Invites
 *     parameters:
 *       - in : query
 *         name: status
 *         description: Invite status
 *         enum: [pending, accepted]
 *         schema:
 *           type: string
 *         required: true
 *       - in : query
 *         name: type
 *         description: Invite type
 *         enum: [sent, received]
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invite details fetched successfully.
 */
namedRouter.get('api.invite.get', '/invite', async (req, res) => {
  try {
    const response = await inviteController.getInvites(req.user, req.query);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /api/invite/{inviteCode}/add:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: add invite link for existing user via invite link
 *     tags:
 *       - Invites
 *     parameters:
 *       - in : path
 *         name: inviteCode
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invite details fetched successfully.
 */
namedRouter.get(
  'api.addInvite.get',
  '/invite/:inviteCode/add',
  async (req, res) => {
    try {
      const response = await inviteController.addInvite(
        req.user,
        req.params.inviteCode,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/invite/remove:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: remove partner from scorekeeper
 *     tags:
 *       - Invites
 *     responses:
 *       200:
 *         description: Invite details fetched successfully.
 */
namedRouter.get('api.removePartner.get', '/invite/remove', async (req, res) => {
  try {
    const response = await inviteController.partnerRemove(req.user);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

module.exports = router;
