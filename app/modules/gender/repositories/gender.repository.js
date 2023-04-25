const mongoose = require('mongoose');
const Gender = require('gender/models/gender.model');
const perPage = config.PAGINATION_PERPAGE;

const GenderRepository = {
  getAll: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({
        isDeleted: false,
      });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        //and_clauses.push({"status": /req.body.query.generalSearch/i});
        and_clauses.push({
          $or: [
            {
              title: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        and_clauses.push({
          status: req.body.query.Status,
        });
      }
      conditions['$and'] = and_clauses;

      var sortOperator = {
        $sort: {},
      };
      if (_.has(req.body, 'sort')) {
        var sortField = req.body.sort.field;
        if (req.body.sort.sort == 'desc') {
          var sortOrder = -1;
        } else if (req.body.sort.sort == 'asc') {
          var sortOrder = 1;
        }

        sortOperator['$sort'][sortField] = sortOrder;
      } else {
        sortOperator['$sort']['price'] = 1;
      }

      var aggregate = Gender.aggregate([
        {
          $match: conditions,
        },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allGender = await Gender.aggregatePaginate(aggregate, options);
      return allGender;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  },

  getById: async (id) => {
    try {
      let gender = await Gender.findById(id).exec();
      return gender;
    } catch (e) {
      throw e;
    }
  },

  getByField: async (params) => {
    try {
      let gender = await Gender.findOne(params).exec();
      return gender;
    } catch (e) {
      throw e;
    }
  },

  getAllByField: async (params) => {
    try {
      let gender = await Gender.find(params).sort({ price: 1 }).exec();
      return gender;
    } catch (e) {
      throw e;
    }
  },

  delete: async (id) => {
    try {
      let gender = await Gender.findById(id);

      if (gender) {
        let genderDelete = await Gender.remove({
          _id: id,
        }).exec();
        return genderDelete;
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  },

  deleteByField: async (field, fieldValue) => {
    //todo: Implement delete by field
  },

  updateById: async (data, id) => {
    try {
      let gender = await Gender.findByIdAndUpdate(id, data, {
        new: true,
        upsert: true,
      }).exec();
      return gender;
    } catch (e) {
      throw e;
    }
  },

  getGenderCount: async (params) => {
    try {
      let gender = await Gender.countDocuments(params);
      return gender;
    } catch (e) {
      throw e;
    }
  },

  updateByField: async (field, fieldValue, data) => {
    //todo: update by field
  },

  save: async (data) => {
    try {
      let gender = await Gender.create(data);
      if (!gender) {
        return null;
      }
      return gender;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  },
};

module.exports = GenderRepository;
