const notificationModel = require('../models/notifications.model');
const notificationsRepo = {
  save: async (data) => {
    try {
      const response = await notificationModel.create(data);
      await response.populate({
        path: 'sentBy',
        select: 'full_name profile_pic',
      });
      return response;
    } catch (e) {
      throw e;
    }
  },
  update: async (id, data) => {
    try {
      return notificationModel.findOneAndUpdate(id, data, { new: true });
    } catch (e) {
      throw e;
    }
  },
  find: async (params) => {
    try {
      return notificationModel.find(params);
    } catch (e) {
      throw e;
    }
  },
  getAll: async (filterParams, limit) => {
    try {
      return notificationModel
        .find(filterParams)
        .sort({ _id: -1 })
        .limit(limit)
        .populate({ path: 'sentBy', select: 'full_name profile_pic' });
    } catch (e) {
      throw e;
    }
  },
  findOne: async (params) => {
    try {
      return notificationModel.findOne(params);
    } catch (e) {
      throw e;
    }
  },
  updateMany: async (filter, params) => {
    try {
      return notificationModel.updateMany(filter, params);
    } catch (e) {
      throw e;
    }
  },
};
module.exports = notificationsRepo;
