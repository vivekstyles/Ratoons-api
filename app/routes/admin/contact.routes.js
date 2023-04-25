const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
const multer = require('multer');
const ContactController = require('contact/controllers/contact.controller');

const request_param = multer();

namedRouter.all('/contact*', auth.authenticate);

// contact Get All Route
namedRouter.post('contact.getall', '/contact/getall', async (req, res) => {
  try {
    const success = await ContactController.getAll(req, res);
    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});
// contact Edit Route
namedRouter.get('contact.view', '/contact/view/:id', ContactController.view);
// Export the express.Router() instance
module.exports = router;
