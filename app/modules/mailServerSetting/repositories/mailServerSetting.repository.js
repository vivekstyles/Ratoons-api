const mongoose = require('mongoose');
const MailServerSetting = require('mailServerSetting/models/mailServerSetting.model.js');
const perPage = config.PAGINATION_PERPAGE;

const mailServerSettingRepository = {
  getById: async (id) => {
    let data = await MailServerSetting.findById(id).lean().exec();
    try {
      if (!data) {
        return null;
      }
      return cms;
    } catch (e) {
      return e;
    }
  },

  getByField: async (params) => {
    let data = await MailServerSetting.findOne(params).exec();
    try {
      if (!data) {
        return null;
      }
      return data;
    } catch (e) {
      return e;
    }
  },

  updateById: async (object, id) => {
    try {
      let data = await MailServerSetting.findByIdAndUpdate(id, object, {
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
};

module.exports = mailServerSettingRepository;
