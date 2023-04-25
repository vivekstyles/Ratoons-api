const mailServerSettingRepo = require('mailServerSetting/repositories/mailServerSetting.repository');
const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const mongoose = require('mongoose');

class mailServerSettingController {
  constructor() {
    this.mailServerSetting = [];
  }

  /*
    // @Method: edit
    // @Description:  cms update page
    */
  async edit(req, res) {
    try {
      let result = {};
      let mailServerSetting = await mailServerSettingRepo.getByField({
        status: 'Active',
      });

      // This is for language section //
      // This is for language section //

      if (!_.isEmpty(mailServerSetting)) {
        res.status(200).send({
          data: mailServerSetting,
          message: 'Mail Server Setting Fetched Successfully!',
        });
      } else {
        res.status(404).send({
          message: 'Sorry mail server Setting not found!',
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).send({ message: e });
    }
  }

  /* @Method: update
    // @Description: cms update action
    */
  async update(req, res) {
    try {
      let mailServerSettingData = await mailServerSettingRepo.getByField({
        _id: req.body.id,
      });

      if (!_.isEmpty(mailServerSettingData)) {
        let mailServerSettingUpdate = mailServerSettingRepo.updateById(
          req.body,
          mongoose.Types.ObjectId(req.body.id),
        );

        if (mailServerSettingUpdate) {
          res.status(200).send({
            data: mailServerSettingUpdate,
            message: 'Setting Updated Successfully',
          });
        }
      } else {
        res.status(404).send({
          message: 'Setting not found!',
        });
      }
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }

  /*
    // @Method: status_change
    // @Description: cms status change action
    */
  async statusChange(req, res) {
    try {
      let cms = await cmsRepo.getById(req.params.id);
      if (!_.isEmpty(cms)) {
        let cmsStatus = cms.status == 'Active' ? 'Inactive' : 'Active';
        let cmsUpdate = await cmsRepo.updateById(
          { status: cmsStatus },
          req.params.id,
        );
        if (cmsUpdate) {
          res.status(200).send({
            data: cmsUpdate,
            message: 'Cms status has changed successfully',
          });
        }
      } else {
        res.status(404).send({
          message: 'sorry cms data not found',
        });
      }
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }

  /* @Method: delete
    // @Description: cms delete
    */
  async destroy(req, res) {
    try {
      let cmsDelete = await cmsRepo.delete(req.params.id);
      if (!_.isEmpty(cmsDelete)) {
        res.status(200).send({
          message: 'Cms Removed Successfully',
        });
      }
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }
}

module.exports = new mailServerSettingController();
