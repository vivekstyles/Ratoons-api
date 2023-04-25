const contactRepo = require('contact/repositories/contact.repository');
const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const querystring = require('querystring');
const fs = require('fs');
const errorHandler = require('../../../errorHandler');

class contactController {
  /*
    // @Method: view
    // @Description:  contact view page
    */
  async view(req, res) {
    try {
      let result = {};
      let contactData = await contactRepo.getById(req.params.id);
      if (!_.isEmpty(contactData)) {
        result.contact_data = contactData;
        res.status(200).send({
          data: contactData,
          message: 'Contact fetched successfully.',
        });
      } else {
        res.status(404).send({
          message: 'Sorry contact details not found!',
        });
      }
    } catch (e) {
      return res.status(500).send({
        message: e.message,
      });
    }
  }
  /* @Method: getAll
    // @Description: To get all the contact from DB
    */
  async getAll(req, res) {
    try {
      let contactData = await contactRepo.getAll(req);
      if (_.has(req.body, 'sort')) {
        var sortOrder = req.body.sort.sort;
        var sortField = req.body.sort.field;
      } else {
        var sortOrder = -1;
        var sortField = '_id';
      }
      let meta = {
        page: req.body.pagination.page,
        pages: contactData.pageCount,
        perpage: req.body.pagination.perpage,
        total: contactData.totalCount,
        sort: sortOrder,
        field: sortField,
      };
      return {
        status: 200,
        meta: meta,
        data: contactData.data,
        message: `Data fetched successfully.`,
      };
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new contactController();
