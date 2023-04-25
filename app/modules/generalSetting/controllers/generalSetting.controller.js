const generalSettingRepo = require('generalSetting/repositories/generalSetting.repository');
const mongoose = require('mongoose');
const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const fs = require('fs');
const gm = require('gm').subClass({
  imageMagick: true,
});

class generalSettingController {
  constructor() {
    this.general = [];
  }

  /*
    // @Method: edit
    // @Description:  cms update page
    */
  async edit(req, res) {
    try {
      let result = {};
      let general = await generalSettingRepo.getAllByField({
        isDeleted: false,
        status: 'Active',
      });

      if (!_.isEmpty(general)) {
        res.status(200).send({
          data: general[0],
          message: 'General Setting Fetched Successfully!',
        });
      } else {
        res.status(404).send({
          message: 'Sorry General Setting Not Found!',
        });
      }
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  }

  /* @Method: update
    // @Description: cms update action
    */
  async update(req, res) {
    try {
      let general = await generalSettingRepo.getById(
        mongoose.Types.ObjectId(req.body.id),
      );
      if (!_.isEmpty(general)) {
        //if (req.files.length > 0) {
        //    if (general.site_favicon != "") {
        //        fs.unlink("./public/uploads/generalSetting/" + general.site_favicon, function (err) {
        //            if (err) req.flash("error", err.message);
        //          }
        //        );
        //    }
        //    req.body.site_favicon = req.files[0].filename;
        //  }
        if (_.has(req.body, 'liveStream') && req.body.liveStream == 'on') {
          req.body.liveStream = 'Enabled';
        } else {
          req.body.liveStream = 'Suspended';
        }
        if (_.has(req.body, 'massMessage') && req.body.massMessage == 'on') {
          req.body.massMessage = 'Enabled';
        } else {
          req.body.massMessage = 'Suspended';
        }

        let generalSetting = await generalSettingRepo.updateById(
          req.body,
          mongoose.Types.ObjectId(req.body.id),
        );
        global.site_name = generalSetting.site_title;
        if (generalSetting) {
          res.status(200).send({
            message: 'General Setting Updated Successfully!',
          });
        }
      }
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }
}

module.exports = new generalSettingController();
