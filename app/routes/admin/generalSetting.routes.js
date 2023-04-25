const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const generalsettingController = require('generalSetting/controllers/generalSetting.controller');
const multer = require('multer');

const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (file.fieldname === 'site_favicon') {
      callback(null, './public/uploads/generalSetting');
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

namedRouter.all('/general-setting*', auth.authenticate);

namedRouter.get(
  'admin.setting.generaledit',
  '/general-setting/edit',
  generalsettingController.edit,
);
namedRouter.post(
  'admin.setting.generalupdate',
  '/general-setting/update',
  uploadFile.any(),
  generalsettingController.update,
);

module.exports = router;
