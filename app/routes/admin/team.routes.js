const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const multer = require('multer');
const teamController = require('sports_team/controllers/sports_team.controller');

const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/team');
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
namedRouter.all('/team*', auth.authenticate);

// Get All teams
namedRouter.post('team.getall', '/team/getall', async (req, res) => {
  try {
    const success = await teamController.getAll(req, res);

    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

namedRouter.post(
  'team.insert',
  '/team/insert',
  uploadFile.any(),
  teamController.insert,
);

// team Edit Route
namedRouter.get(
  'team.edit',
  '/team/edit/:id',
  request_param.any(),
  teamController.edit,
);

// team Update Route
namedRouter.post(
  'team.update',
  '/team/update',
  uploadFile.any(),
  teamController.updates,
);

// team Delete Route
namedRouter.get('team.delete', '/team/delete/:id', teamController.delete);

//team Status Change Route
namedRouter.get(
  'team.statusChange',
  '/team/status-change/:id',
  request_param.any(),
  teamController.statusChange,
);

// Export the express.Router() instance
module.exports = router;
