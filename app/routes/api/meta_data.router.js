const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const metaDataController = require('../../modules/meta_data/controllers/meta_data.controller');

namedRouter.all('/meta-data*', auth.authenticateAPI);

/**
 * @swagger
 * /api/meta-data/{category}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get meta data by category
 *     tags:
 *       - Meta Data
 *     parameters:
 *       - in : path
 *         name: category
 *         description: Meta data category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meta data fetched successfully.
 */
namedRouter.get(
  'api.metadata.getByCategory',
  '/meta-data/:category',
  async (req, res) => {
    try {
      const response = await metaDataController.getByCategory(
        req.params.category,
      );
      res.status(response.status || 500).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

module.exports = router;
