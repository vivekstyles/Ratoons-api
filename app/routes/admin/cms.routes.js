const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const cmsController = require('../../modules/cms/controllers/cms.controller');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     CmsPostDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the cms
 *         slug:
 *           type: string
 *           description: Slug of the cms
 *         content:
 *           type: string
 *           description: Content of the cms
 *       example:
 *         title: CMS title
 *         slug: cms-slug
 *         content: CMS content
 *     CmsPutDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the cms
 *         slug:
 *           type: string
 *           description: Slug of the cms
 *         content:
 *           type: string
 *           description: Content of the cms
 *         isActive:
 *           type: boolean
 *           description: true or false
 *       example:
 *         title: CMS title
 *         slug: cms-slug
 *         content: CMS content
 *         isActive: true
 */

namedRouter.all('/cms*', auth.authenticateAdminAPI);

/**
 * @swagger
 * /admin/cms:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List all cms details
 *     tags:
 *       - Admin CMS
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
 *         description: CMS data fetched successfully.
 */
namedRouter.get('cms.getall', '/cms', async (req, res) => {
  try {
    const response = await cmsController.getAll(req.query);
    res.status(response.status || 500).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * @swagger
 * /admin/cms:
 *   post:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Create cms details
 *     tags:
 *       - Admin CMS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CmsPostDto'
 *     responses:
 *       200:
 *         description: CMS details updated successfully.
 */
namedRouter.post('cms.create', '/cms', async (req, res) => {
  try {
    const response = await cmsController.create(req.body);
    res.status(response.status || 500).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * @swagger
 * /admin/cms/{cms_id}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get cms details by id
 *     tags:
 *       - Admin CMS
 *     parameters:
 *       - in : path
 *         name: cms_id
 *         description: Cms id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: CMS details fetched successfully.
 */
namedRouter.get('cms.get', '/cms/:cms_id', async (req, res) => {
  try {
    const response = await cmsController.getCMCById(req.params.cms_id);
    res.status(response.status || 500).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * @swagger
 * /admin/cms/{cms_id}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Update cms details
 *     tags:
 *       - Admin CMS
 *     parameters:
 *       - in : path
 *         name: cms_id
 *         description: Cms id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CmsPutDto'
 *     responses:
 *       200:
 *         description: CMS details updated successfully.
 */
namedRouter.put('cms.update', '/cms/:cms_id', async (req, res) => {
  try {
    console.log('params', req.params.cms_id, req.body);
    const response = await cmsController.update(req.params.cms_id, req.body);
    res.status(response.status || 500).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * @swagger
 * /admin/cms/{cms_id}:
 *   delete:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Delete cms details
 *     tags:
 *       - Admin CMS
 *     parameters:
 *       - in : path
 *         name: cms_id
 *         description: Cms id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: CMS details deleted successfully.
 */
namedRouter.delete('cms.delete', '/cms/:cms_id', async (req, res) => {
  try {
    const response = await cmsController.delete(req.params.cms_id, req.body);
    res.status(response.status || 500).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
