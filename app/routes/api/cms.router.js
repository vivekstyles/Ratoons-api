const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const cmsController = require('../../modules/cms/controllers/cms.controller');

/**
 * @swagger
 * /api/cms:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List all cms details
 *     tags:
 *       - CMS
 *     parameters:
 *       - in : query
 *         name: q
 *         description: Search value
 *         schema:
 *           type: string
 *       - in : query
 *         name: limit
 *         description: Limit value
 *         schema:
 *           type: string
 *       - in : query
 *         name: page
 *         description: Limit value
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CMS data fetched successfully.
 */
namedRouter.get('api.cms.list', '/cms', async (req, res) => {
  try {
    const success = await cmsController.getAll(req.query);
    res.status(success.status).send(success);
  } catch (error) {
    res.status(error.status).send(error);
  }
});

/**
 * @swagger
 * /api/cms/{slug}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List cms details based on slug
 *     tags:
 *       - CMS
 *     parameters:
 *       - in : path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: CMS data fetched successfully.
 */
namedRouter.get('api.cms', '/cms/:slug', async (req, res) => {
  try {
    const success = await cmsController.getCMC(req.params.slug);
    res.status(success.status).send(success);
  } catch (error) {
    res.status(error.status).send(error);
  }
});

module.exports = router;
