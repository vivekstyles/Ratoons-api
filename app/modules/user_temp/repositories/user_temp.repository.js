const UserTemp = require('user_temp/models/user_temp.model');
const perPage = config.PAGINATION_PERPAGE;

class UserTempRepository {
  constructor() {}

  async getById(id) {
    try {
      return await UserTemp.findById(id).lean().exec();
    } catch (error) {
      return error;
    }
  }

  async getByField(params) {
    try {
      return await UserTemp.findOne(params).exec();
    } catch (error) {
      return error;
    }
  }

  async getAllByField(params) {
    try {
      return await UserTemp.find(params).lean().exec();
    } catch (error) {
      return error;
    }
  }

  async delete(id) {
    try {
      await UserTemp.findById(id).lean().exec();
      return await UserTemp.deleteOne({ _id: id }).lean().exec();
    } catch (error) {
      return error;
    }
  }

  async updateById(data, id) {
    try {
      return await UserTemp.findByIdAndUpdate(id, data, {
        new: true,
        upsert: true,
      })
        .lean()
        .exec();
    } catch (error) {
      return error;
    }
  }

  async save(data) {
    try {
      return await UserTemp.create(data).lean().exec();
    } catch (error) {
      return error;
    }
  }
}

module.exports = new UserTempRepository();
