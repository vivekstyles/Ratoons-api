const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const SubPlanController = require('../../modules/subscription_plan/controllers/subscription_plan.controller');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     SubPlanPostDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the plan
 *         slug:
 *           type: string
 *           description: Slug of the plan
 *         isPro:
 *           type: boolean
 *           description: True or false
 *         isTrial:
 *           type: boolean
 *           description: True or false
 *         trialDays:
 *           type: number
 *           description: No. of trial days
 *         price:
 *           type: string
 *           description: Subscription price
 *         term:
 *           type: string
 *           description: Subscription term
 *         subDetails:
 *           type: Array
 *           description: Subscription details as comma separated array
 *         showFamilyTab:
 *           type: boolean
 *           description: True or false
 *         isMilitaryDiscount:
 *           type: boolean
 *           description: True or false
 *       example:
 *         title: Subscription name
 *         slug: subscription-slug
 *         isTrial: true
 *         isPro: false
 *         trialDays: 14
 *         price: $14.99
 *         term: monthly
 *         subDetails: [Create and manage unlimited athletes, Create and manage unlimited teams]
 *         showFamilyTab: true
 *         isMilitaryDiscount: true
 */

namedRouter.all('/subscription-plan*', auth.authenticateAdminAPI);

/**
 * @swagger
 * /admin/subscription-plan:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get subscription plans
 *     tags:
 *       - Admin Subscription Plan
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
 *           enum: [title]
 *     responses:
 *       200:
 *         description: Subscripiton plans fetched successfully.
 */
namedRouter.get('/subscription-plan', async (req, res) => {
  try {
    const response = await SubPlanController.getAllPlans(req.query, true);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/subscription-plan/{id}:
 *   get:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Get subscription plan
 *     tags:
 *       - Admin Subscription Plan
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Plan id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscripiton plans fetched successfully.
 */
namedRouter.get('/subscription-plan/:id', async (req, res) => {
  try {
    const response = await SubPlanController.getPlan(req.params.id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/subscription-plan:
 *   post:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Create subscription plan
 *     tags:
 *       - Admin Subscription Plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/SubPlanPostDto'
 *     responses:
 *       200:
 *         description: Subscripiton plan saved successfully.
 */
namedRouter.post('/subscription-plan', async (req, res) => {
  try {
    const response = await SubPlanController.createPlan(req.body);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/subscription-plan/{id}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Update subscription plan
 *     tags:
 *       - Admin Subscription Plan
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Plan id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/SubPlanPostDto'
 *     responses:
 *       200:
 *         description: Subscripiton plan saved successfully.
 */
namedRouter.put('/subscription-plan/:id', async (req, res) => {
  try {
    const response = await SubPlanController.updatePlan(
      req.params.id,
      req.body,
    );
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});

/**
 * @swagger
 * /admin/subscription-plan/{id}:
 *   delete:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: Delete subscription plan
 *     tags:
 *       - Admin Subscription Plan
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Plan id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscripiton plan deleted successfully.
 */
namedRouter.delete('/subscription-plan/:id', async (req, res) => {
  try {
    const response = await SubPlanController.removePlan(req.params.id);
    res.status(response.status || 500).send(response);
  } catch (e) {
    res.status(500).send({ status: 500, message: e.message });
  }
});
module.exports = router;
