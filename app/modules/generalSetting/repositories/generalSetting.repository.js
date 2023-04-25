const mongoose = require('mongoose');
const GeneralSetting = require('../models/generalSetting.model');
const perPage = config.PAGINATION_PERPAGE;

const generalSettingRepository = {
  getById: async (id) => {
    let data = await GeneralSetting.findById(id).lean().exec();
    try {
      if (!data) {
        return null;
      }
      return data;
    } catch (e) {
      return e;
    }
  },

  getByField: async (params) => {
    let data = await GeneralSetting.findOne(params).exec();
    try {
      if (!data) {
        return null;
      }
      return data;
    } catch (e) {
      return e;
    }
  },

  getAllByField: async (params) => {
    let data = await GeneralSetting.find(params).exec();
    try {
      if (!data) {
        return null;
      }
      return data;
    } catch (e) {
      return e;
    }
  },

  delete: async (id) => {
    try {
      let data = await GeneralSetting.findById(id);
      if (data) {
        let dataDelete = await GeneralSetting.deleteOne({ _id: id }).exec();
        if (!dataDelete) {
          return null;
        }
        return dataDelete;
      }
    } catch (e) {
      throw e;
    }
  },

  deleteByField: async (field, fieldValue) => {
    //todo: Implement delete by field
  },

  updateById: async (object, id) => {
    try {
      let data = await GeneralSetting.findByIdAndUpdate(id, object, {
        new: true,
      });
      if (!data) {
        return null;
      }
      return data;
    } catch (e) {
      return e;
    }
  },

  updateByField: async (field, fieldValue, data) => {
    //todo: update by field
  },

  save: async (data) => {
    try {
      let save = await GeneralSetting.create(data);
      if (!save) {
        return null;
      }
      return save;
    } catch (e) {
      return e;
    }
  },
};

module.exports = generalSettingRepository;
