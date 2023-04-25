const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const scoreController = require('score/controllers/score.controller');
const multer = require('multer');

const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (req.files[0].fieldname.match('image') != null) {
      callback(null, './public/uploads/score');
    } else {
      callback(null, './public/uploads');
    }
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
  },
});

const uploadFile = multer({
  storage: Storage,
});
const request_param = multer();

//authentication section of score
namedRouter.all('/score*', auth.authenticate);

namedRouter.post('score.getall', '/score/getall', async (req, res) => {
  try {
    const success = await scoreController.getAll(req, res);
    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

module.exports = router;
