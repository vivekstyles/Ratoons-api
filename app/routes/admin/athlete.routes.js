const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const multer = require('multer');
const athleteController = require('athlete/controllers/athlete.controller');

const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/athlete');
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
  },
});
const uploadFile = multer({
  storage: Storage,
});
const request_param = multer();

//Authenticate Routes
namedRouter.all('/athlete*', auth.authenticate);

// Get All athletes
namedRouter.post('athlete.getall', '/athlete/getall', async (req, res) => {
  try {
    const success = await athleteController.getAll(req, res);

    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

namedRouter.post(
  'athlete.insert',
  '/athlete/insert',
  uploadFile.any(),
  athleteController.insert,
);

// athlete Update Route
namedRouter.post(
  'athlete.update',
  '/athlete/update',
  uploadFile.any(),
  athleteController.update,
);

// athlete Delete Route
namedRouter.get(
  'athlete.delete',
  '/athlete/delete/:id',
  athleteController.delete,
);

//athlete Status Change Route
namedRouter.get(
  'athlete.statusChange',
  '/athlete/status-change/:id',
  request_param.any(),
  athleteController.statusChange,
);

// Export the express.Router() instance
module.exports = router;
