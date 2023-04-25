const FAQ = require('faq/models/faq.model');

const faqRepository = {
  getAll: async (filterParams, options) => {
    try {
      return FAQ.paginate(filterParams, options);
    } catch (e) {
      throw e;
    }
  },

  getAllFaq: async (params) => {
    try {
      const _params = {
        params,
        isDeleted: false,
      };
      return await FAQ.find(_params).lean().exec();
    } catch (error) {
      return error;
    }
  },

  getById: async (id) => {
    try {
      return FAQ.findById(id);
    } catch (e) {
      throw e;
    }
  },

  getByField: async (params) => {
    let faq = await FAQ.findOne(params).exec();
    try {
      if (!faq) {
        return null;
      }
      return faq;
    } catch (e) {
      return e;
    }
  },

  getAllByField: async (params) => {
    let faq = await FAQ.find(params).exec();
    try {
      if (!faq) {
        return null;
      }
      return faq;
    } catch (e) {
      return e;
    }
  },

  save: async (data) => {
    try {
      let faq = await FAQ.create(data);
      if (!faq) {
        return null;
      }
      return faq;
    } catch (e) {
      return e;
    }
  },

  deleteByField: async (field, fieldValue) => {
    //todo: Implement delete by field
  },

  updateById: async (data, id) => {
    try {
      let faqDelete = await FAQ.findByIdAndUpdate(id, data, {
        new: true,
        upsert: true,
      }).exec();
      if (!faqDelete) {
        return null;
      }
      return faqDelete;
    } catch (e) {
      return e;
    }
  },

  updateByField: async (field, fieldValue, data) => {
    //todo: update by field
  },

  getFaqCount: async (params) => {
    try {
      let faq = await FAQ.countDocuments(params);
      return faq;
    } catch (e) {
      throw e;
    }
  },
};

module.exports = faqRepository;
