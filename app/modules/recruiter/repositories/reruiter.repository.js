const reruiterModel = require('../models/reruiter.model');
const reruiterRepo = {
    save: async (data) => {
      try {
        const response = await reruiterModel.create(data);
        await response.populate({
          path: 'user',
          select: '_id',
        });
        return response;
      } catch (e) {
        throw e;
      }
    },
    update: async (id, data) => {
      try {
        return reruiterModel.findOneAndUpdate(id, data, { new: true });
      } catch (e) {
        throw e;
      }
    },
    find: async (params) => {
      try {
        return reruiterModel.find(params);
      } catch (e) {
        throw e;
      }
    },
    getAll: async (filterParams, limit) => {
      try {
        return reruiterModel
          .find(filterParams)
          .sort({ _id: -1 })
          .limit(limit)
          .populate({ path: 'user', select: 'full_name profile_pic' });
      } catch (e) {
        throw e;
      }
    },
    findOne: async (params) => {
      try {
        return reruiterModel.findOne(params);
      } catch (e) {
        throw e;
      }
    },
    updateMany: async (filter, params) => {
      try {
        return reruiterModel.updateMany(filter, params);
      } catch (e) {
        throw e;
      }
    },
  };

module.exports = reruiterRepo;