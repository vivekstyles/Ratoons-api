const faqRepo = require('../repositories/faq.repository');

class FaqController {
  async getAll(params, isAdmin = false) {
    try {
      const filterParams = {
        isDeleted: false,
      };
      const options = {
        limit: params.limit ? Number(params.limit) : 10,
        page: params.page ? Number(params.page) : 1,
        sort: {},
        select: 'title content isActive',
      };
      if (params.q) {
        const q = new RegExp(params.q, 'i');
        filterParams.title = { $regex: q };
      }
      if (!isAdmin) {
        filterParams.isActive = true;
        options.select = 'title content';
      }
      if (params.sortBy) {
        Object.assign(options.sort, {
          [params.sortBy]: params.sort == 'desc' ? -1 : 1,
        });
      }
      const response = await faqRepo.getAll(filterParams, options);
      return { status: 200, data: response, message: 'Faq details fetched' };
    } catch (e) {
      throw e;
    }
  }

  async getFaq(id) {
    try {
      const faq = await faqRepo.getById(id);
      if (!faq) {
        return { status: 404, message: 'FAQ not found' };
      }
      return { status: 200, data: faq, message: 'FAQ fetched successfully' };
    } catch (e) {
      throw e;
    }
  }

  async create(data) {
    try {
      const faqData = await faqRepo.getByField({
        title: data.title,
      });
      if (faqData) {
        return { status: 409, message: 'FAQ already exist with same question' };
      }
      const faq = await faqRepo.save(data);
      if (!faq) {
        return { status: 500, message: 'FAQ not created, please try later' };
      }
      return {
        status: 200,
        data: faq,
        message: 'FAQ created successfully',
      };
    } catch (e) {
      throw e;
    }
  }

  async update(id, params) {
    try {
      let faq = await faqRepo.getById(id);
      if (!faq) {
        return { status: 404, message: 'Faq not found' };
      }
      if (params.title) faq.title = params.title;
      if (params.content) faq.content = params.content;
      if (params.hasOwnProperty('isActive')) faq.isActive = params.isActive;
      await faq.save();
      return { status: 200, data: faq, message: 'Faq updated successfully' };
    } catch (e) {
      throw e;
    }
  }

  async delete(id) {
    try {
      let faq = await faqRepo.getById(id);
      if (!faq) {
        return { status: 404, message: 'FAQ not found' };
      }
      faq.isDeleted = true;
      await faq.save();
      return { status: 200, message: 'FAQ removed successfully' };
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new FaqController();
