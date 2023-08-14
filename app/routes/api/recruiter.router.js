const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const recruiterController = require('../../modules/recruiter/controllers/recruiter.controllers');

namedRouter.all('/recruiter*', auth.authenticateAPI);

/**
 * @swagger
 * /api/recruiter:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List all recruiter post
 *     tags:
 *       - recruiter
 *     parameters:
 *       - in : query
 *         name: limit
 *         description: Limit value
 *         schema:
 *           type: string
 *       - in : query
 *         name: lastId
 *         description: Last recruiter id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: recruiter fetched successfully.
 */
namedRouter.get('api.recruiter.get', '/recruiter', async (req, res) => {
  try {
    const response = await recruiterController.getRecruiterPosts(req.user._id, req.query);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /api/recruiter:
 *   post:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: recruiter uploads the job post
 *     tags:
 *       - recruiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               externalLink:
 *                 type: string
 *               image:
 *                 type: string
 *               file:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - content
 *                   - content-link
 *                   - content-image
 *                   - content-image-link
 *                   - content-file
 *                   - content-file-link
 *     responses:
 *       200:
 *         description: uploaded post successfully.
 */
namedRouter.post('api.recruiter.post', '/recruiter', async (req, res) => {
  try {
    const response = await await recruiterController.create(req.user, req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

module.exports = router;
