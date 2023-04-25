const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
const multer = require('multer');
const genderController = require('gender/controllers/gender.controller');

const request_param = multer();

namedRouter.all('/gender*', auth.authenticate);

// gender Get All Route
namedRouter.post('gender.getall', '/gender/getall', async (req, res) => {
  try {
    const success = await genderController.getAll(req, res);
    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

// gender Insert Route
namedRouter.post(
  'gender.insert',
  '/gender/insert',
  request_param.any(),
  genderController.insert,
);

// gender Edit Route
namedRouter.get('gender.edit', '/gender/edit/:id', genderController.edit);

// gender Update Route
namedRouter.post(
  'gender.update',
  '/gender/update',
  request_param.any(),
  genderController.update,
);

// gender Delete Route
namedRouter.get('gender.delete', '/gender/delete/:id', genderController.delete);

// gender status change
namedRouter.get(
  'gender.statusChange',
  '/gender/status-change/:id',
  request_param.any(),
  genderController.statusChange,
);

// Export the express.Router() instance
module.exports = router;
