const cmsRepo = require('../repositories/cms.repository');

class cmsController {
  async getAll(params, isAdmin = false) {
    try {
      const filterParams = { isDeleted: false };
      const options = {
        limit: params.limit ? Number(params.limit) : 10,
        page: params.page ? Number(params.page) : 1,
        sort: {},
        select: 'title content slug isActive',
      };
      if (params.q) {
        const q = new RegExp(params.q, 'i');
        filterParams.title = { $regex: q };
      }
      if (!isAdmin) {
        filterParams.isActive = true;
        options.select = 'title content slug';
      }
      if (params.sortBy) {
        Object.assign(options.sort, {
          [params.sortBy]: params.sort == 'desc' ? -1 : 1,
        });
      }
      const response = await cmsRepo.getAll(filterParams, options);
      return { status: 200, data: response, message: 'CMS details fetched' };
    } catch (e) {
      throw e;
    }
  }

  async getCMCById(id) {
    try {
      let cms = await cmsRepo.getByField({ _id: id, isDeleted: false });
      if (!cms) {
        return { status: 404, message: 'Item not found' };
      }
      return { status: 200, data: cms, message: 'Item updated successfully' };
    } catch (e) {
      throw e;
    }
  }

  async getCMC(slug) {
    try {
      let cms = await cmsRepo.getByField({
        slug: slug,
        isDeleted: false,
        isActive: true,
      });
      if (!cms) {
        return { status: 404, message: 'Item not found' };
      }
      return { status: 200, data: cms, message: 'Item fetched successfully' };
    } catch (e) {
      throw e;
    }
  }

  async create(params) {
    try {
      let cms = await cmsRepo.getByField({ slug: params.slug });
      if (cms) {
        return { status: 409, message: 'Slug already exists' };
      }
      const response = await cmsRepo.save(params);
      return {
        status: 200,
        data: response,
        message: 'Item created successfully',
      };
    } catch (e) {
      throw e;
    }
  }

  async update(id, params) {
    try {
      let cms = await cmsRepo.getById(id);
      if (!cms) {
        return { status: 404, message: 'Item not found' };
      }
      if (params.title) cms.title = params.title;
      if (params.content) cms.content = params.content;
      if (params.hasOwnProperty('isActive')) cms.isActive = params.isActive;
      await cms.save();
      return { status: 200, data: cms, message: 'Item updated successfully' };
    } catch (e) {
      throw e;
    }
  }

  async delete(id) {
    try {
      let cms = await cmsRepo.getById(id);
      if (!cms) {
        return { status: 404, message: 'Item not found' };
      }
      cms.isDeleted = true;
      await cms.save();
      return { status: 200, data: cms, message: 'Item deleted successfully' };
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new cmsController();
