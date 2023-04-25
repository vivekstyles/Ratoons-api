const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const faqController = require('../../modules/faq/controllers/faq.controller');

namedRouter.all('/faq*', auth.authenticateAdminAPI);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     FaqPostDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the faq
 *         content:
 *           type: string
 *           description: Content of the faq
 *       example:
 *         title: FAQ title
 *         content: FAQ content
 *     FaqPutDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the faq
 *         content:
 *           type: string
 *           description: Content of the faq
 *         isActive:
 *           type: boolean
 *           description: true or false
 *       example:
 *         title: FAQ title
 *         content: FAQ content
 *         isActive: true
 */

/**
 * @swagger
 * /admin/faq:
 *   get:
 *     tags:
 *       - Admin FAQ
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Fetch all FAQ's
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
 *           enum: [isActive, title]
 *     responses:
 *       200:
 *         description: FAQ's saved successfully.
 */
namedRouter.get('faq.getall', '/faq', async (req, res) => {
  try {
    const response = await faqController.getAll(req.query, true);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/faq/{faq_id}:
 *   get:
 *     tags:
 *       - Admin FAQ
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Fetch FAQ details
 *     parameters:
 *       - in : path
 *         name: faq_id
 *         description: Faq id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: FAQ fetched successfully.
 */
namedRouter.get('faq.fetch', '/faq/:faq_id', async (req, res) => {
  try {
    const response = await faqController.getFaq(req.params.faq_id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/faq:
 *   post:
 *     tags:
 *       - Admin FAQ
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Create new FAQ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FaqPostDto'
 *     responses:
 *       200:
 *         description: FAQ's saved successfully.
 */
namedRouter.post('faq.create', '/faq', async (req, res) => {
  try {
    const response = await faqController.create(req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/faq/{faq_id}:
 *   delete:
 *     tags:
 *       - Admin FAQ
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Delete a FAQ
 *     parameters:
 *       - in : path
 *         name: faq_id
 *         description: Faq id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: FAQ's deleted successfully.
 */
namedRouter.delete('faq.delete', '/faq/:faq_id', async (req, res) => {
  try {
    const response = await faqController.delete(req.params.faq_id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/faq/{faq_id}:
 *   put:
 *     tags:
 *       - Admin FAQ
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Update a FAQ
 *     parameters:
 *       - in : path
 *         name: faq_id
 *         description: Faq id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FaqPutDto'
 *     responses:
 *       200:
 *         description: FAQ's updated successfully.
 */
namedRouter.put('faq.update', '/faq/:faq_id', async (req, res) => {
  try {
    const response = await faqController.update(req.params.faq_id, req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

module.exports = router;
