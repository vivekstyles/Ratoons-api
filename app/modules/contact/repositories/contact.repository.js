const mongoose = require('mongoose');
const Contact = require('contact/models/contact.model');
const perPage = config.PAGINATION_PERPAGE;

const ContactRepository = {
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
              date: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              name: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              email: {
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
        sortOperator['$sort']['_id'] = -1;
      }

      var aggregate = Contact.aggregate([
        {
          $project: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            message: '$message',
            date: { $dateToString: { format: '%m-%d-%Y', date: '$createdAt' } },
            status: '$status',
            isDeleted: '$isDeleted',
          },
        },
        {
          $match: conditions,
        },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allContact = await Contact.aggregatePaginate(aggregate, options);
      return allContact;
    } catch (e) {
      throw e;
    }
  },

  getById: async (id) => {
    try {
      let contact = await Contact.findById(id).exec();
      return contact;
    } catch (e) {
      throw e;
    }
  },

  getByField: async (params) => {
    try {
      let contact = await Contact.findOne(params).exec();
      return contact;
    } catch (e) {
      throw e;
    }
  },

  getAllByField: async (params) => {
    try {
      let contact = await Contact.find(params).exec();
      return contact;
    } catch (e) {
      throw e;
    }
  },

  delete: async (id) => {
    try {
      let contact = await Contact.findById(id);

      if (contact) {
        let contactDelete = await Contact.remove({
          _id: id,
        }).exec();
        return contactDelete;
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
      let contact = await Contact.findByIdAndUpdate(id, data, {
        new: true,
        upsert: true,
      }).exec();
      return contact;
    } catch (e) {
      throw e;
    }
  },

  updateByField: async (field, fieldValue, data) => {
    //todo: update by field
  },

  save: async (data) => {
    try {
      let contact = await Contact.create(data);
      if (!contact) {
        return null;
      }
      return contact;
    } catch (e) {
      throw e;
    }
  },
};

module.exports = ContactRepository;
