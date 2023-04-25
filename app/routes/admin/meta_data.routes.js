const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const metaDataController = require('../../modules/meta_data/controllers/meta_data.controller');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     MetaDataPostDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of meta data
 *         category:
 *           type: string
 *           enum: [family-members, military-discount]
 *           description: Category of meta data
 *         subTitle:
 *           type: string
 *           description: Sub Title
 *         description:
 *           type: string
 *           description: Description
 *       example:
 *         title: Partner
 *         category: family-members
 *         subTitle: Add a partner for $3.99
 *         description: Lorem ipsum
 *     MetaDataPutDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of meta data
 *         category:
 *           type: string
 *           enum: [family-members, military-discount]
 *           description: Category of meta data
 *         subTitle:
 *           type: string
 *           description: Subtitle
 *         description:
 *           type: string
 *           description: Description
 *         isActive:
 *           type: boolean
 *           description: True or false
 *       example:
 *         title: Subscription name
 *         category: subscription-slug
 *         subTitle: $14.99
 *         description: monthly
 *         isActive: true
 */
namedRouter.all('/meta-data*', auth.authenticateAdminAPI);

/**
 * @swagger
 * /admin/meta-data:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get all meta data
 *     tags:
 *       - Admin Meta Data
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
 *           enum: [title, subTitle]
 *     responses:
 *       200:
 *         description: Meta data fetched successfully.
 */
namedRouter.get('/meta-data', async (req, res) => {
  try {
    const response = await metaDataController.getAll(req.query, true);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/meta-data/{id}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get meta data by id
 *     tags:
 *       - Admin Meta Data
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Meta data id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meta data fetched successfully.
 */
namedRouter.get('/meta-data/:id', async (req, res) => {
  try {
    const response = await metaDataController.getById(req.params.id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/meta-data:
 *   post:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Create meta data
 *     tags:
 *       - Admin Meta Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/MetaDataPostDto'
 *     responses:
 *       200:
 *         description: Meta data saved successfully.
 */
namedRouter.post('/meta-data', async (req, res) => {
  try {
    const response = await metaDataController.save(req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/meta-data/{id}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Update meta data by id
 *     tags:
 *       - Admin Meta Data
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Meta data id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/MetaDataPutDto'
 *     responses:
 *       200:
 *         description: Meta data updated successfully.
 */
namedRouter.put('/meta-data/:id', async (req, res) => {
  try {
    const response = await metaDataController.update(req.params.id, req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/meta-data/{id}:
 *   delete:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Delete meta data
 *     tags:
 *       - Admin Meta Data
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Meta data id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meta data deleted successfully.
 */
namedRouter.delete('/meta-data/:id', async (req, res) => {
  try {
    const response = await metaDataController.remove(req.params.id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

module.exports = router;
