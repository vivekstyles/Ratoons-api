const mongoose = require('mongoose');
const Cms = require('cms/models/cms.model');
const perPage = config.PAGINATION_PERPAGE;

const cmsRepository = {
  getAll: async (filterParams, options) => {
    try {
      return Cms.paginate(filterParams, options);
    } catch (e) {
      throw e;
    }
  },

  save: async (params) => {
    try {
      return Cms.create(params);
    } catch (e) {
      throw e;
    }
  },

  getById: async (id) => {
    try {
      return Cms.findById(id);
    } catch (e) {
      return e;
    }
  },

  getByField: async (params) => {
    try {
      return Cms.findOne(params);
    } catch (e) {
      return e;
    }
  },

  getAllByField: async (params) => {
    let user = await Cms.find(params).exec();
    try {
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getCmsCount: async (params) => {
    try {
      let cmsCount = await Cms.countDocuments(params);
      if (!cmsCount) {
        return null;
      }
      return cmsCount;
    } catch (e) {
      return e;
    }
  },

  delete: async (id) => {
    try {
      let cms = await Cms.findById(id);
      if (cms) {
        let cmsDelete = await Cms.remove({ _id: id }).exec();
        if (!cmsDelete) {
          return null;
        }
        return cmsDelete;
      }
    } catch (e) {
      throw e;
    }
  },

  deleteByField: async (field, fieldValue) => {
    //todo: Implement delete by field
  },

  updateById: async (data, id) => {
    try {
      let cms = await Cms.findByIdAndUpdate(id, data, {
        new: true,
        upsert: true,
      }).exec();
      if (!cms) {
        return null;
      }
      return cms;
    } catch (e) {
      return e;
    }
  },

  updateByField: async (field, fieldValue, data) => {
    //todo: update by field
  },
};

module.exports = cmsRepository;
