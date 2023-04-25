const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
const cmsRepo = require('cms/repositories/cms.repository');

class cmsController {
  constructor() {
    this.cms = [];
  }

  async list(req, res) {
    try {
      const cmsData = await cmsRepo.getAllByField({
        isDeleted: false,
        status: 'Active',
      });
      if (!_.isEmpty(cmsData)) {
        return {
          status: 200,
          data: cmsData,
          message: 'cms data fetched successfully.',
        };
      } else {
        return { status: 200, data: cmsData, message: 'cms Not Available.' };
      }
    } catch (error) {
      res.status(500).send({ status: 500, message: error.message });
    }
  }

  async details(req, res) {
    try {
      let slug = req.params.slug;
      const cmsData = await cmsRepo.getByField({
        isDeleted: false,
        status: 'Active',
        slug: slug,
      });
      if (!_.isEmpty(cmsData)) {
        return {
          status: 200,
          data: cmsData,
          message: 'cms data fetched successfully.',
        };
      } else {
        return { status: 200, data: cmsData, message: 'cms Not Available.' };
      }
    } catch (error) {
      res.status(500).send({ status: 500, message: error.message });
    }
  }
}

module.exports = new cmsController();
