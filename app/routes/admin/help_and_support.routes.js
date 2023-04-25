const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const hasController = require('../../modules/help_and_support/controllers/help_and_support.controller');
const multer = require('multer');
const request_param = multer();

namedRouter.all('/help-and-support*', auth.authenticateAdminAPI);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     AdminCommentsPostDto:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Issue description or message
 *         image:
 *           type: file
 *           format: binary
 *           description: Screenshot or image for reference
 *     AdminHasPutDto:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Issue status to be updated
 *           enum: [Open, Closed, Inprogress, Reopen]
 */

/**
 * @swagger
 * /admin/help-and-support:
 *   get:
 *     tags:
 *       - Admin Help And Support
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Fetch all issues
 *     parameters:
 *       - in : query
 *         name: q
 *         description: Search value
 *         schema:
 *           type: string
 *       - in : query
 *         name: user
 *         description: User id
 *         schema:
 *           type: string
 *       - in : query
 *         name: category
 *         description: Issue category
 *         schema:
 *           type: string
 *           enum: [general, payment, fraudorscam, others]
 *       - in : query
 *         name: status
 *         description: Issue status
 *         schema:
 *           type: string
 *           enum: [Open, Closed, Inprogress, Reopen]
 *       - in : query
 *         name: limit
 *         description: Limit value
 *         schema:
 *           type: string
 *       - in : query
 *         name: page
 *         description: Page no
 *         schema:
 *           type: string
 *       - in : query
 *         name: sort
 *         description: Sort string
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in : query
 *         name: sortBy
 *         description: Sort by field name
 *         schema:
 *           type: string
 *           enum: [status, subject]
 *     responses:
 *       200:
 *         description: FAQ's fetched successfully.
 */
namedRouter.get('/help-and-support', async (req, res) => {
  try {
    const success = await hasController.getIssuesForAdmin(req.query);
    res.status(success.status).send(success);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.meesage });
  }
});

/**
 * @swagger
 * /admin/help-and-support/{id}/comments:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Add comments
 *     tags:
 *       - Admin Help And Support
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Issue id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *          schema:
 *            $ref: '#/components/schemas/AdminCommentsPostDto'
 *     responses:
 *       200:
 *         description: Added comments successfully.
 */
namedRouter.put(
  '/help-and-support/:id/comments',
  request_param.single('image'),
  async (req, res) => {
    try {
      const success = await hasController.addComments(req, true);
      res.status(success.status || 500).send(success);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

/**
 * @swagger
 * /admin/help-and-support/{id}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Updates issue status
 *     tags:
 *       - Admin Help And Support
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Issue id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/AdminHasPutDto'
 *     responses:
 *       200:
 *         description: Updated issue status successfully.
 */
namedRouter.put('/help-and-support/:id', async (req, res) => {
  try {
    const success = await hasController.updateIssueStatus(
      req.params.id,
      req.body.status,
    );
    res.status(success.status || 500).send(success);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/help-and-support/{id}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Updates issue status
 *     tags:
 *       - Admin Help And Support
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Issue id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Issue fetched successfully.
 */
namedRouter.get('/help-and-support/:id', async (req, res) => {
  try {
    const success = await hasController.getIssue(req.params.id);
    res.status(success.status || 500).send(success);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

module.exports = router;
