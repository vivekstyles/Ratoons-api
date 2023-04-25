const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const multer = require('multer');
const faqController = require('../../modules/faq/controllers/faq.controller');
const request_param = multer();

namedRouter.all('/faq*', auth.authenticateAPI);
/**
 * @swagger
 * /api/faq:
 *   get:
 *     tags:
 *       - FAQ
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Lists all faq's
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
 *         description: FAQ's fetched successfully.
 */
namedRouter.get(
  'api.faq.list',
  '/faq',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await faqController.getAll(req.query);
      res.status(success.status).send(success);
    } catch (error) {
      res.status(error.status).send(error);
    }
  },
);

module.exports = router;
