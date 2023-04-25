const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const multer = require('multer');
const contactController = require('webservice/contact.controller');
const request_param = multer();

namedRouter.all('/contact*', auth.authenticateAPI);

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactPostDTO:
 *       type: object
 *       required:
 *         - name
 *         - nickname
 *         - image
 *       properties:
 *         name:
 *           type: string
 *           description: Contact name
 *         email:
 *           type: string
 *           description: Contact email
 *         message:
 *           type: string
 *           description: Message
 *       example:
 *         name: Alexa
 *         email: alexa@yopmail.com
 *         message: Hello there. I have a message for you.
 */

/**
 * @swagger
 * /api/contact/support:
 *   post:
 *     security:
 *      - ApiKeyAuth: []
 *     summary: List all cms details
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactPostDTO'
 *     responses:
 *       200:
 *         description: Contact data successfully.
 */
namedRouter.post(
  'api.contact.support',
  '/contact/support',
  request_param.any(),
  async (req, res) => {
    try {
      const success = await contactController.support(req, res);
      res.status(success.status).send(success);
    } catch (error) {
      res.status(error.status).send(error);
    }
  },
);

// Export the express.Router() instance
module.exports = router;
