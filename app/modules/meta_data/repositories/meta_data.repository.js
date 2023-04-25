const MetaDataModel = require('../../meta_data/models/meta_data.model');
const metaDataRepository = {
  save: async (data) => {
    try {
      return MetaDataModel.create(data);
    } catch (e) {
      throw e;
    }
  },
  update: async (id, data) => {
    try {
      return MetaDataModel.findOneAndUpdate({ _id: id }, data, { new: true });
    } catch (e) {
      throw e;
    }
  },
  findOne: async (params) => {
    try {
      return MetaDataModel.findOne(params);
    } catch (e) {
      throw e;
    }
  },
  getByCategory: async (category) => {
    try {
      return MetaDataModel.find({
        category: category,
        isDeleted: false,
      }).select('title subTitle description category');
    } catch (e) {
      throw e;
    }
  },
  findAll: async (params) => {
    try {
      return MetaDataModel.find(params);
    } catch (e) {
      throw e;
    }
  },
  getAll: async (params, options) => {
    try {
      return MetaDataModel.paginate(params, options);
    } catch (e) {
      throw e;
    }
  },
};
module.exports = metaDataRepository;
