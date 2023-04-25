const metaDataRepo = require('../repositories/meta_data.repository');
class MetaData {
  async save(data) {
    try {
      //Save meta details
      const response = await metaDataRepo.save(data);
      return {
        status: 200,
        data: response,
        message: 'Meta data saved successfully',
      };
    } catch (e) {
      throw e;
    }
  }

  async update(id, data) {
    try {
      //Check if meta exists
      const metaData = await metaDataRepo.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!metaData) {
        return { status: 404, message: 'Meta data not found' };
      }
      //Update meta details
      const response = await metaDataRepo.update(id, data);
      return {
        status: 200,
        data: response,
        message: 'Meta data updated successfully',
      };
    } catch (e) {
      throw e;
    }
  }

  async remove(id) {
    try {
      const metaData = await metaDataRepo.findOne({
        _id: id,
        isDeleted: false,
      });
      //throw error if meta is not found
      if (!metaData) {
        return { status: 404, message: 'Meta not found' };
      }
      //set isDeleted prop
      metaData.isDeleted = true;
      await metaData.save();
      return { status: 200, message: 'Meta deleted sucessfully' };
    } catch (e) {
      throw e;
    }
  }

  async getByCategory(category) {
    try {
      const response = await metaDataRepo.getByCategory(category);
      if (!response) {
        return { status: 404, message: 'Meta not found' };
      }
      return { status: 200, data: response, message: 'Meta data fetched' };
    } catch (e) {
      throw e;
    }
  }

  async getById(id) {
    try {
      const response = await metaDataRepo.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!response) {
        return { status: 404, message: 'Meta not found' };
      }
      return { status: 200, data: response, message: 'Meta data fetched' };
    } catch (e) {
      throw e;
    }
  }

  async getAll(params, isAdmin = false) {
    try {
      const filterParams = { isDeleted: false };
      if (!isAdmin) params.isActive = true;
      const options = {
        limit: params.limit ? Number(params.limit) : 10,
        page: params.page ? Number(params.page) : 1,
        sort: {},
      };
      if (params.q) {
        const q = new RegExp(params.q, 'i');
        filterParams.$or = [
          { title: { $regex: q } },
          { subTitle: { $regex: q } },
        ];
      }
      //Sort only by one field at a time
      if (params.sortBy) {
        Object.assign(options.sort, {
          [params.sortBy]: params.sort == 'desc' ? -1 : 1,
        });
      }
      //Fetch all active and non deleted plans
      const plans = await metaDataRepo.getAll(filterParams, options);
      return {
        status: 200,
        data: plans,
        message: 'Meta data fetched',
      };
    } catch (e) {
      throw e;
    }
  }
}
module.exports = new MetaData();
