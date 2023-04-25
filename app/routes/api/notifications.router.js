const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const notifiController = require('../../modules/notifications/controllers/notifications.controller');

namedRouter.all('/notification*', auth.authenticateAPI);

/**
 * @swagger
 * /api/notification:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List all user notifications
 *     tags:
 *       - Notification
 *     parameters:
 *       - in : query
 *         name: limit
 *         description: Limit value
 *         schema:
 *           type: string
 *       - in : query
 *         name: lastId
 *         description: Last notification id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications fetched successfully.
 */
namedRouter.get('api.notification.get', '/notification', async (req, res) => {
  try {
    const response = await notifiController.getUnreadUserNotifications(
      req.user._id,
      req.query,
    );
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /api/notification/pending:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List all user pending notifications
 *     tags:
 *       - Notification
 *     responses:
 *       200:
 *         description: Notifications fetched successfully.
 */
namedRouter.get(
  'api.notification.pending',
  '/notification/pending',
  async (req, res) => {
    try {
      const response = await notifiController.getPendingInviteNotifications(
        req.user._id,
        'partner-requested',
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/notification/clear:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Clear all user notifications count
 *     tags:
 *       - Notification
 *     responses:
 *       200:
 *         description: Notification updated successfully.
 */
namedRouter.put(
  'api.notification.clear',
  '/notification/clear',
  async (req, res) => {
    try {
      const response = await notifiController.clearUserNotificationsCount(
        req.user,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/notification/clearAll/{lastId}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Clear all user notifications
 *     tags:
 *       - Notification
 *     parameters:
 *       - in : param
 *         name: lastId
 *         description: Last notification id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification cleared successfully.
 */
namedRouter.put(
  'api.notification.clearAll',
  '/notification/clearAll/:lastId',
  async (req, res) => {
    try {
      const response = await notifiController.clearAllUserNotifications(
        req.user,
        req.params?.lastId || '',
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /api/notification/{id}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Update user notification as read
 *     tags:
 *       - Notification
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Notification id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Notification updated successfully.
 */
namedRouter.put('api.notification', '/notification/:id', async (req, res) => {
  try {
    const response = await notifiController.markAsRead(req.user, req.params.id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

module.exports = router;
