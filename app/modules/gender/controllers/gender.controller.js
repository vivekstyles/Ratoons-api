const genderRepo = require('gender/repositories/gender.repository');
const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
const fs = require('fs');
const mongoose = require('mongoose');
const errorHandler = require('../../../errorHandler');

class genderController {
  /* @Method: insert
    // @Description: save gender action
    */
  async insert(req, res) {
    try {
      let genderExist = await genderRepo.getByField({
        isDeleted: false,
        title: req.body.title,
      });
      if (_.isEmpty(genderExist)) {
        let SaveGender = await genderRepo.save(req.body);
        res.status(200).send({
          data: SaveGender,
          message: 'Gender added successfully.',
        });
      } else {
        res.status(409).send({
          message: 'Gender already exist',
        });
      }
    } catch (e) {
      const error = errorHandler(e);
      res.status(500).send({ message: error.message });
    }
  }

  /*
    // @Method: edit
    // @Description:  gender edit page
    */
  async edit(req, res) {
    try {
      let genderValue = await genderRepo.getById(req.params.id);
      if (!_.isEmpty(genderValue)) {
        res.status(200).send({
          data: genderValue,
          message: 'Gender details fetched successfully',
        });
      } else {
        res.status(404).send({
          message: 'Sorry gender not found!',
        });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /* @Method: update
    // @Description: gender update action
    */
  async update(req, res) {
    try {
      const genderId = req.body.sid;
      let genderExist = await genderRepo.getByField({
        isDeleted: false,
        title: req.body.title,
        _id: { $ne: mongoose.Types.ObjectId(genderId) },
      });

      if (_.isEmpty(genderExist)) {
        let genderUpdate = await genderRepo.updateById(req.body, genderId);
        if (genderUpdate) {
          res.status(200).send({
            data: genderUpdate,
            message: 'Gender  updated successfully',
          });
        }
      } else {
        res.status(409).send({
          message: 'Gender "' + req.body.title + '" already exist.',
        });
      }
    } catch (e) {
      const error = errorHandler(e);
      res.status(500).send({ message: error.message });
    }
  }

  /* @Method: getAll
    // @Description: To get all the gender from DB
    */
  async getAll(req, res) {
    try {
      let genderDetails = await genderRepo.getAll(req);

      if (_.has(req.body, 'sort')) {
        var sortOrder = req.body.sort.sort;
        var sortField = req.body.sort.field;
      } else {
        var sortOrder = 1;
        var sortField = 'title';
      }
      let meta = {
        page: req.body.pagination.page,
        pages: genderDetails.pageCount,
        perpage: req.body.pagination.perpage,
        total: genderDetails.totalCount,
        sort: sortOrder,
        field: sortField,
      };
      return {
        status: 200,
        meta: meta,
        data: genderDetails.data,
        message: `Data fetched successfully.`,
      };
    } catch (e) {
      throw e;
    }
  }

  /* @Method: delete
    // @Description: gender delete
    */
  async delete(req, res) {
    try {
      await genderRepo.updateById({ isDeleted: true }, req.params.id);
      res.status(200).send({
        message: 'Gender removed successfully',
      });
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }

  /*
    // @Method: statusChange
    // @Description: gender status change action
    */
  async statusChange(req, res) {
    try {
      let gender = await genderRepo.getById(req.params.id);
      if (!_.isEmpty(gender)) {
        let genderStatus = gender.status == 'Active' ? 'Inactive' : 'Active';
        let genderUpdate = genderRepo.updateById(
          {
            status: genderStatus,
          },
          req.params.id,
        );
        res.status(200).send({
          data: genderUpdate,
          message: 'Gender status has changed successfully',
        });
      } else {
        res.status(404).send({
          message: 'Sorry gender not found',
        });
      }
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }
}

module.exports = new genderController();
