const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const mailServerSettingController = require('mailServerSetting/controllers/mailServerSetting.controller');
const multer = require('multer');

const request_param = multer();

namedRouter.all('/mailServerSetting*', auth.authenticate);

namedRouter.get(
  'admin.setting.mailServerSetting',
  '/mailServerSetting/edit',
  mailServerSettingController.edit,
);
namedRouter.post(
  'admin.setting.mailServerSettingupdate',
  '/mailServerSetting/update',
  request_param.any(),
  mailServerSettingController.update,
);

module.exports = router;
