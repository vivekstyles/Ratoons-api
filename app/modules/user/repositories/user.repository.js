const mongoose = require('mongoose');
const User = require('../../user/models/user.model');
const perPage = config.PAGINATION_PERPAGE;
var moment = require('moment');

const userRepository = {
  fineOneWithRole: async (email) => {
    try {
      return User.findOne({
        email: email,
        isDeleted: false,
        status: 'Active',
      })
        .populate({ path: 'role', select: 'role' })
        .exec();
    } catch (e) {
      return e;
    }
  },

  getAllUsers: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({ isDeleted: false });
      and_clauses.push({ role: req.body.role });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        and_clauses.push({
          $or: [
            {
              full_name: {
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
            {
              phone: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        if (req.body.query.Status == 'Active') {
          and_clauses.push({ status: 'Active' });
        }
        if (req.body.query.Status == 'Inactive') {
          and_clauses.push({ status: 'Inactive' });
        }
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };
      if (_.has(req.body, 'sort')) {
        var sortField = req.body.sort.field;
        if (req.body.sort.field == 'signup_date') {
          sortField = 'createdAt';
        }
        if (req.body.sort.field == 'last_login_date_string') {
          sortField = 'last_login';
        }

        if (req.body.sort.sort == 'desc') {
          var sortOrder = -1;
        } else if (req.body.sort.sort == 'asc') {
          var sortOrder = 1;
        }
        sortOperator['$sort'][sortField] = sortOrder;
      } else {
        sortOperator['$sort']['_id'] = -1;
      }

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'referred_by',
            as: 'referrals',
          },
        },
        {
          $unwind: {
            path: '$referrals',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'login_sessions',
            localField: '_id',
            foreignField: 'user_id',
            as: 'login_sessions',
          },
        },
        {
          $unwind: {
            path: '$login_sessions',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            profile_pic: { $first: '$profile_pic' },
            full_name: { $first: '$full_name' },
            email: { $first: '$email' },
            phone: { $first: '$phone' },
            role: { $first: '$user_role.role' },
            privacy_settings: { $first: '$privacy_settings' },
            status: { $first: '$status' },
            createdAt: { $first: '$createdAt' },
            isDeleted: { $first: '$isDeleted' },
          },
        },
        {
          $project: {
            _id: '$_id',
            profile_pic: '$profile_pic',
            full_name: '$full_name',
            email: '$email',
            phone: '$phone',
            role: '$role',
            status: '$status',
            createdAt: '$createdAt',
            signup_date: {
              $dateToString: { format: '%m-%d-%Y', date: '$createdAt' },
            },
            isDeleted: '$isDeleted',
          },
        },

        { $match: conditions },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allUsers = await User.aggregatePaginate(aggregate, options);
      return allUsers;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  },

  searchAllUsers: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({
        isVerified: true,
        status: 'Active',
        isDeleted: false,
        isSubscribe: true,
        bank_account_added: true,
        // "profile_pic": { $ne: "" },
        // "cover_image": { $ne: "" },
        role: { $eq: mongoose.Types.ObjectId(param.role_id) },
        'privacy_settings.show_in_search_result': true,
      });

      if (
        _.has(param, 'user_id') &&
        param.user_id != '' &&
        param.user_id != null
      ) {
        and_clauses.push({
          _id: { $ne: mongoose.Types.ObjectId(param.user_id) },
        });
      }

      if (
        _.has(param, 'category_id') &&
        param.category_id != '' &&
        param.category_id != null
      ) {
        and_clauses.push({
          category_id: mongoose.Types.ObjectId(param.category_id),
        });
      }

      if (
        _.has(param, 'body_type_id') &&
        param.body_type_id != '' &&
        param.body_type_id != null
      ) {
        and_clauses.push({
          body_type_id: mongoose.Types.ObjectId(param.body_type_id),
        });
      }

      if (
        _.has(param, 'gender') &&
        param.gender != '' &&
        param.gender != null
      ) {
        and_clauses.push({ gender: { $regex: param.gender, $options: 'i' } });
      }

      if (
        _.has(param, 'height') &&
        param.height != '' &&
        param.height != null &&
        _.has(param, 'height_unit') &&
        param.height_unit != '' &&
        param.height_unit != null
      ) {
        and_clauses.push({
          height: parseFloat(param.height),
          height_unit: param.height_unit,
        });
      }

      if (
        _.has(param, 'location') &&
        param.location != '' &&
        param.location != null
      ) {
        and_clauses.push({
          $or: [
            { location: { $regex: param.location, $options: 'i' } },
            { city: { $regex: param.city, $options: 'i' } },
            { state: { $regex: param.state, $options: 'i' } },
            { country: { $regex: param.country, $options: 'i' } },
          ],
        });
      }

      if (
        _.has(param, 'city') ||
        _.has(param, 'state') ||
        _.has(param, 'country')
      ) {
        and_clauses.push({
          $or: [
            { city: { $regex: param.city, $options: 'i' } },
            { state: { $regex: param.state, $options: 'i' } },
            { country: { $regex: param.country, $options: 'i' } },
          ],
        });
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };

      var result = await User.aggregate([
        // { "$unwind": "$category_id" },
        {
          $unwind: {
            path: '$category_id',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        { $match: conditions },
        {
          $group: {
            _id: '$_id',
            full_name: { $first: '$full_name' },
            username: { $first: '$username' },
            phone: { $first: '$phone' },
            email: { $first: '$email' },
            website_url: { $first: '$website_url' },
            wallet_balance: { $first: '$wallet_balance' },
            short_dec: { $first: '$short_dec' },
            category_id: { $push: '$category_id' },
            profile_pic: { $first: '$profile_pic' },
            cover_image: { $first: '$cover_image' },
            height: { $first: '$height' },
            social_id: { $first: '$social_id' },
            referred_by: { $first: '$referred_by' },
            rewards: { $first: '$rewards' },
            register_type: { $first: '$register_type' },
            subscription_amount: { $first: '$subscription_amount' },
            live: { $first: '$live' },
            lastLogoutTime: { $first: '$lastLogoutTime' },
            loginStatus: { $first: '$loginStatus' },
            activityStatus: { $first: '$activityStatus' },
            canReceiveCall: { $first: '$canReceiveCall' },
            email_notification: { $first: '$email_notification' },
            push_notification: { $first: '$push_notification' },
            isVerified: { $first: '$isVerified' },
            status: { $first: '$status' },
            isDeleted: { $first: '$isDeleted' },
            isSubscribe: { $first: '$isSubscribe' },
            bank_account_added: { $first: '$bank_account_added' },
            role: { $first: '$user_role' },
            privacy_settings: { $first: '$privacy_settings' },
            location: { $first: '$location' },
            city: { $first: '$city' },
            state: { $first: '$state' },
            country: { $first: '$country' },
          },
        },
      ]);

      return result;
    } catch (e) {
      throw e;
    }
  },

  getAllReferralUsers: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({ isDeleted: false });
      and_clauses.push({
        referred_by: mongoose.Types.ObjectId(req.body.user_id),
      });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        and_clauses.push({
          $or: [
            {
              full_name: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              username: {
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
            {
              phone: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              registration_date: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        if (req.body.query.Status == 'Active') {
          and_clauses.push({ status: 'Active' });
        }
        if (req.body.query.Status == 'Inactive') {
          and_clauses.push({ status: 'Inactive' });
        }
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };
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

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $project: {
            _id: '$_id',
            profile_pic: '$profile_pic',
            full_name: '$full_name',
            username: '$username',
            email: '$email',
            phone: '$phone',
            referred_by: '$referred_by',
            role: '$user_role.role',
            registration_date: {
              $dateToString: { format: '%m-%d-%Y', date: '$createdAt' },
            },
            privacy_settings: '$privacy_settings',
            status: '$status',
            isDeleted: '$isDeleted',
          },
        },
        { $match: conditions },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allUsers = await User.aggregatePaginate(aggregate, options);
      return allUsers;
    } catch (e) {
      throw e;
    }
  },

  getAllReferralPerformers: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({ isDeleted: false });
      and_clauses.push({
        referred_by: mongoose.Types.ObjectId(req.body.user_id),
      });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        and_clauses.push({
          $or: [
            {
              full_name: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              username: {
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
            {
              phone: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              registration_date: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        if (req.body.query.Status == 'Active') {
          and_clauses.push({ status: 'Active' });
        }
        if (req.body.query.Status == 'Inactive') {
          and_clauses.push({ status: 'Inactive' });
        }
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };
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

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $project: {
            _id: '$_id',
            profile_pic: '$profile_pic',
            full_name: '$full_name',
            username: '$username',
            email: '$email',
            phone: '$phone',
            referred_by: '$referred_by',
            role: '$user_role.role',
            registration_date: {
              $dateToString: { format: '%m-%d-%Y', date: '$createdAt' },
            },
            privacy_settings: '$privacy_settings',
            status: '$status',
            isDeleted: '$isDeleted',
          },
        },
        { $match: conditions },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allUsers = await User.aggregatePaginate(aggregate, options);
      return allUsers;
    } catch (e) {
      throw e;
    }
  },

  getAllPerformerUsers: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({ isDeleted: false });
      and_clauses.push({ role: req.body.role });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        and_clauses.push({
          $or: [
            {
              full_name: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              username: {
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
            {
              phone: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              signup_date: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              last_login_date_string: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        if (req.body.query.Status == 'Active') {
          and_clauses.push({ status: 'Active' });
        }
        if (req.body.query.Status == 'Inactive') {
          and_clauses.push({ status: 'Inactive' });
        }
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };
      if (_.has(req.body, 'sort')) {
        var sortField = req.body.sort.field;
        if (req.body.sort.field == 'signup_date') {
          sortField = 'createdAt';
        }
        if (req.body.sort.field == 'last_login_date_string') {
          sortField = 'last_login';
        }

        if (req.body.sort.sort == 'desc') {
          var sortOrder = -1;
        } else if (req.body.sort.sort == 'asc') {
          var sortOrder = 1;
        }
        sortOperator['$sort'][sortField] = sortOrder;
      } else {
        sortOperator['$sort']['_id'] = -1;
      }

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'referred_by',
            as: 'referrals',
          },
        },
        {
          $unwind: {
            path: '$referrals',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'login_sessions',
            localField: '_id',
            foreignField: 'user_id',
            as: 'login_sessions',
          },
        },
        {
          $unwind: {
            path: '$login_sessions',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            profile_pic: { $first: '$profile_pic' },
            full_name: { $first: '$full_name' },
            username: { $first: '$username' },
            email: { $first: '$email' },
            phone: { $first: '$phone' },
            role: { $first: '$user_role.role' },
            referrals: { $addToSet: '$referrals' },
            rewards: { $first: '$rewards' },
            privacy_settings: { $first: '$privacy_settings' },
            canAddSubscriptionPromotion: {
              $first: '$canAddSubscriptionPromotion',
            },
            status: { $first: '$status' },
            createdAt: { $first: '$createdAt' },
            isDeleted: { $first: '$isDeleted' },
            last_login: { $max: '$login_sessions.loggedInAt' },
          },
        },
        {
          $project: {
            _id: '$_id',
            profile_pic: '$profile_pic',
            full_name: '$full_name',
            username: '$username',
            email: '$email',
            phone: '$phone',
            role: '$role',
            referrals_count: {
              $cond: {
                if: { $isArray: '$referrals' },
                then: { $size: '$referrals' },
                else: 0,
              },
            },
            rewards: '$rewards',
            privacy_settings: '$privacy_settings',
            canAddSubscriptionPromotion: {
              $ifNull: ['$canAddSubscriptionPromotion', true],
            },
            status: '$status',
            createdAt: '$createdAt',
            signup_date: {
              $dateToString: { format: '%m-%d-%Y', date: '$createdAt' },
            },
            isDeleted: '$isDeleted',
            last_login: '$last_login',
            last_login_month: {
              $toInt: { $dateToString: { format: '%m', date: '$last_login' } },
            },
            last_login_date: {
              $dateToString: { format: '%d,%Y %H:%M', date: '$last_login' },
            },
          },
        },
        {
          $addFields: {
            last_login_month: {
              $let: {
                vars: {
                  monthsInString: [
                    ,
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                  ],
                },
                in: {
                  $arrayElemAt: ['$$monthsInString', '$last_login_month'],
                },
              },
            },
          },
        },
        {
          $addFields: {
            last_login_date_string: {
              $concat: ['$last_login_month', ' ', '$last_login_date'],
            },
          },
        },
        {
          $addFields: {
            last_login_date_string: {
              $ifNull: ['$last_login_date_string', 'N/A'],
            },
          },
        },
        { $match: conditions },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allUsers = await User.aggregatePaginate(aggregate, options);
      return allUsers;
    } catch (e) {
      throw e;
    }
  },

  getAllSubscribersByParam: async (params) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      and_clauses.push({
        'subscriptions.subscribe_user_id': mongoose.Types.ObjectId(
          params.user_id,
        ),
      });
      and_clauses.push({ isDeleted: false });

      and_clauses.push({
        'subscriptions.subscription_start_date': {
          $lte: new Date(currentDateTime),
        },
        'subscriptions.subscription_end_date': {
          $gte: new Date(currentDateTime),
        },
        'subscriptions.status': 'active',
      });

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'subscriber_user_id',
            as: 'subscriptions',
          },
        },
        { $unwind: '$subscriptions' },
        { $match: conditions },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            phone: '$phone',
            email: '$email',
            location: '$location',
            website_url: '$website_url',
            wallet_balance: '$wallet_balance',
            short_dec: '$short_dec',
            category_id: '$category_id',
            profile_pic: '$profile_pic',
            cover_image: '$cover_image',
            social_id: '$social_id',
            referred_by: '$referred_by',
            rewards: '$rewards',
            register_type: '$register_type',
            isVerified: '$isVerified',
            subscription_amount: '$subscription_amount',
            isSubscribe: '$isSubscribe',
            isDeleted: '$isDeleted',
            email_notification: '$email_notification',
            push_notification: '$push_notification',
            push_endpoint: '$push_endpoint',
            push_p256dh: '$push_p256dh',
            push_auth: '$push_auth',
            live: '$live',
            status: '$status',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
            bank_account_added: '$bank_account_added',
          },
        },
      ]).exec();
    } catch (e) {
      throw e;
    }
  },

  getAllPerformerSubscriptionByParam: async (params) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      if (_.isObject(params) && _.has(params, 'user_id')) {
        and_clauses.push({
          'subscriptions.subscriber_user_id': mongoose.Types.ObjectId(
            params.user_id,
          ),
        });
      }

      if (_.isObject(params) && _.has(params, 'isDeleted')) {
        and_clauses.push({ isDeleted: params.isDeleted });
      }

      if (_.isObject(params) && _.has(params, 'user_role')) {
        and_clauses.push({ 'user_role.role': params.user_role });
      }

      and_clauses.push({
        'subscriptions.subscription_start_date': {
          $lte: new Date(currentDateTime),
        },
        'subscriptions.subscription_end_date': {
          $gte: new Date(currentDateTime),
        },
        'subscriptions.status': 'active',
      });

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'subscribe_user_id',
            as: 'subscriptions',
          },
        },
        { $unwind: '$subscriptions' },
        { $match: conditions },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            phone: '$phone',
            email: '$email',
            location: '$location',
            website_url: '$website_url',
            wallet_balance: '$wallet_balance',
            short_dec: '$short_dec',
            category_id: '$category_id',
            profile_pic: '$profile_pic',
            cover_image: '$cover_image',
            social_id: '$social_id',
            referred_by: '$referred_by',
            rewards: '$rewards',
            register_type: '$register_type',
            isVerified: '$isVerified',
            subscription_amount: '$subscription_amount',
            isSubscribe: '$isSubscribe',
            isDeleted: '$isDeleted',
            email_notification: '$email_notification',
            push_notification: '$push_notification',
            lastLogoutTime: '$lastLogoutTime',
            loginStatus: '$loginStatus',
            activityStatus: '$activityStatus',
            canReceiveCall: '$canReceiveCall',
            live: '$live',
            status: '$status',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
            bank_account_added: '$bank_account_added',
          },
        },
      ]).exec();
    } catch (e) {
      throw e;
    }
  },

  countFansByParam: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      if (_.has(param, 'status') && param.status == 'active') {
        and_clauses.push({
          subscription_start_date: { $lte: new Date(currentDateTime) },
          subscription_renew_date: { $gte: new Date(currentDateTime) },
          subscription_status: 'active',
        });
      }

      if (_.has(param, 'status') && param.status == 'expired') {
        and_clauses.push({
          $or: [
            { subscription_status: 'canceled' },
            { subscription_renew_date: { $lt: new Date(currentDateTime) } },
          ],
        });
      }

      and_clauses.push({
        isVerified: true,
        status: 'Active',
        isDeleted: false,
      });

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'subscriber_user_id',
            as: 'subscriptions',
          },
        },
        { $unwind: '$subscriptions' },
        {
          $match: {
            'subscriptions.subscribe_user_id': mongoose.Types.ObjectId(
              param.logged_in_user,
            ),
          },
        },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            isVerified: '$isVerified',
            subscription_id: '$subscriptions._id',
            subscription_amount: '$subscription_amount',
            subscription_start_date: '$subscriptions.subscription_start_date',
            subscription_renew_date: '$subscriptions.subscription_end_date',
            subscription_end: '$subscriptions.subscription_end',
            subscription_auto_renew: '$subscriptions.auto_renew',
            subscription_status: '$subscriptions.status',
            isDeleted: '$isDeleted',
            status: '$status',
            role: '$user_role',
          },
        },
        {
          $group: {
            _id: '$_id',
            full_name: { $last: '$full_name' },
            isVerified: { $last: '$isVerified' },
            subscription_id: { $last: '$subscription_id' },
            subscription_amount: { $last: '$subscription_amount' },
            subscription_start_date: { $last: '$subscription_start_date' },
            subscription_renew_date: { $last: '$subscription_renew_date' },
            subscription_end: { $last: '$subscription_end' },
            subscription_auto_renew: { $last: '$subscription_auto_renew' },
            subscription_status: { $last: '$subscription_status' },
            isDeleted: { $last: '$isDeleted' },
            status: { $last: '$status' },
            role: { $last: '$role' },
          },
        },
        { $match: conditions },
      ]).exec();
    } catch (e) {
      throw e;
    }
  },

  searchFansByParam: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      if (_.has(param, 'status') && param.status == 'active') {
        and_clauses.push({
          subscription_start_date: { $lte: new Date(currentDateTime) },
          subscription_renew_date: { $gte: new Date(currentDateTime) },
          subscription_status: 'active',
        });
      }

      if (_.has(param, 'status') && param.status == 'expired') {
        and_clauses.push({
          $or: [
            { subscription_status: 'canceled' },
            { subscription_renew_date: { $lt: new Date(currentDateTime) } },
          ],
        });
      }

      and_clauses.push({
        isVerified: true,
        status: 'Active',
        isDeleted: false,
      });

      if (
        _.has(param, 'category_id') &&
        param.category_id != '' &&
        param.category_id != null
      ) {
        and_clauses.push({
          category_id: mongoose.Types.ObjectId(param.category_id),
        });
      }

      if (
        _.has(param, 'body_type_id') &&
        param.body_type_id != '' &&
        param.body_type_id != null
      ) {
        and_clauses.push({
          body_type_id: mongoose.Types.ObjectId(param.body_type_id),
        });
      }

      if (
        _.has(param, 'gender') &&
        param.gender != '' &&
        param.gender != null
      ) {
        and_clauses.push({ gender: { $regex: param.gender, $options: 'i' } });
      }

      if (
        _.has(param, 'height') &&
        param.height != '' &&
        param.height != null &&
        _.has(param, 'height_unit') &&
        param.height_unit != '' &&
        param.height_unit != null
      ) {
        and_clauses.push({
          height: parseFloat(param.height),
          height_unit: param.height_unit,
        });
      }

      if (
        _.has(param, 'location') &&
        param.location != '' &&
        param.location != null
      ) {
        and_clauses.push({
          $or: [
            { location: { $regex: param.location, $options: 'i' } },
            { city: { $regex: param.location, $options: 'i' } },
            { state: { $regex: param.location, $options: 'i' } },
            { country: { $regex: param.location, $options: 'i' } },
          ],
        });
      }

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'subscriber_user_id',
            as: 'subscriptions',
          },
        },
        { $unwind: '$subscriptions' },
        {
          $match: {
            'subscriptions.subscribe_user_id': mongoose.Types.ObjectId(
              param.logged_in_user,
            ),
          },
        },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            location: '$location',
            wallet_balance: '$wallet_balance',
            short_dec: '$short_dec',
            category_id: '$category_id',
            profile_pic: '$profile_pic',
            cover_image: '$cover_image',
            height: '$height',
            height_unit: '$height_unit',
            privacy_settings: {
              show_in_search_result: {
                $ifNull: ['$privacy_settings.show_in_search_result', true],
              },
              show_activity_status: {
                $ifNull: ['$privacy_settings.show_activity_status', true],
              },
              show_subscription_offers: {
                $ifNull: ['$privacy_settings.show_subscription_offers', true],
              },
              allow_co_streaming_request: {
                $ifNull: [
                  '$privacy_settings.allow_co_streaming_request',
                  'nobody',
                ],
              },
            },
            register_type: '$register_type',
            isVerified: '$isVerified',
            lastLogoutTime: '$lastLogoutTime',
            loginStatus: '$loginStatus',
            activityStatus: '$activityStatus',
            canReceiveCall: '$canReceiveCall',
            subscription_id: '$subscriptions._id',
            subscription_amount: '$subscription_amount',
            subscription_start_date: '$subscriptions.subscription_start_date',
            subscription_renew_date: '$subscriptions.subscription_end_date',
            subscription_end: '$subscriptions.subscription_end',
            subscription_auto_renew: '$subscriptions.auto_renew',
            subscription_status: '$subscriptions.status',
            isSubscribe: '$isSubscribe',
            bank_account_added: '$bank_account_added',
            live: '$live',
            isDeleted: '$isDeleted',
            status: '$status',
            role: '$user_role',
          },
        },
        {
          $group: {
            _id: '$_id',
            full_name: { $last: '$full_name' },
            username: { $last: '$username' },
            location: { $last: '$location' },
            wallet_balance: { $last: '$wallet_balance' },
            short_dec: { $last: '$short_dec' },
            category_id: { $last: '$category_id' },
            profile_pic: { $last: '$profile_pic' },
            cover_image: { $last: '$cover_image' },
            height: { $last: '$height' },
            height_unit: { $last: '$height_unit' },
            privacy_settings: { $last: '$privacy_settings' },
            register_type: { $last: '$register_type' },
            isVerified: { $last: '$isVerified' },
            lastLogoutTime: { $last: '$lastLogoutTime' },
            loginStatus: { $last: '$loginStatus' },
            activityStatus: { $last: '$activityStatus' },
            canReceiveCall: { $last: '$canReceiveCall' },
            subscription_id: { $last: '$subscription_id' },
            subscription_amount: { $last: '$subscription_amount' },
            subscription_start_date: { $last: '$subscription_start_date' },
            subscription_renew_date: { $last: '$subscription_renew_date' },
            subscription_end: { $last: '$subscription_end' },
            subscription_auto_renew: { $last: '$subscription_auto_renew' },
            subscription_status: { $last: '$subscription_status' },
            isSubscribe: { $last: '$isSubscribe' },
            bank_account_added: { $last: '$bank_account_added' },
            live: { $last: '$live' },
            isDeleted: { $last: '$isDeleted' },
            status: { $last: '$status' },
            role: { $last: '$role' },
          },
        },
        { $match: conditions },
      ]).exec();
    } catch (e) {
      console.log(e.message);
      return e;
    }
  },

  countFollowingsByParam: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      if (_.has(param, 'status') && param.status == 'active') {
        and_clauses.push({
          subscription_start_date: { $lte: new Date(currentDateTime) },
          subscription_renew_date: { $gte: new Date(currentDateTime) },
          subscription_status: 'active',
        });
      }

      if (_.has(param, 'status') && param.status == 'expired') {
        and_clauses.push({
          $or: [
            { subscription_status: 'canceled' },
            { subscription_renew_date: { $lt: new Date(currentDateTime) } },
          ],
        });
      }

      if (
        _.has(param, 'listed_user_ids') &&
        !_.isEmpty(param.listed_user_ids)
      ) {
        // and_clauses.push({
        //     "_id": { $all: param.listed_user_ids }
        // });
        and_clauses.push({
          _id: { $in: param.listed_user_ids },
        });
      }

      and_clauses.push({
        isVerified: true,
        status: 'Active',
        isDeleted: false,
      });

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'subscribe_user_id',
            as: 'subscriptions',
          },
        },
        { $unwind: '$subscriptions' },
        {
          $match: {
            'subscriptions.subscriber_user_id': mongoose.Types.ObjectId(
              param.logged_in_user,
            ),
          },
        },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            isVerified: '$isVerified',
            subscription_id: '$subscriptions._id',
            subscription_amount: '$subscription_amount',
            subscription_start_date: '$subscriptions.subscription_start_date',
            subscription_renew_date: '$subscriptions.subscription_end_date',
            subscription_end: '$subscriptions.subscription_end',
            subscription_auto_renew: '$subscriptions.auto_renew',
            subscription_status: '$subscriptions.status',
            isDeleted: '$isDeleted',
            status: '$status',
            role: '$user_role',
          },
        },
        {
          $group: {
            _id: '$_id',
            full_name: { $last: '$full_name' },
            isVerified: { $last: '$isVerified' },
            subscription_id: { $last: '$subscription_id' },
            subscription_amount: { $last: '$subscription_amount' },
            subscription_start_date: { $last: '$subscription_start_date' },
            subscription_renew_date: { $last: '$subscription_renew_date' },
            subscription_end: { $last: '$subscription_end' },
            subscription_auto_renew: { $last: '$subscription_auto_renew' },
            subscription_status: { $last: '$subscription_status' },
            isDeleted: { $last: '$isDeleted' },
            status: { $last: '$status' },
            role: { $last: '$role' },
          },
        },
        { $match: conditions },
      ]).exec();
    } catch (e) {
      throw e;
    }
  },

  searchFollowingsByParam: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      if (_.has(param, 'status') && param.status == 'active') {
        and_clauses.push({
          subscription_start_date: { $lte: new Date(currentDateTime) },
          subscription_renew_date: { $gte: new Date(currentDateTime) },
          subscription_status: 'active',
        });
      }

      if (_.has(param, 'status') && param.status == 'expired') {
        and_clauses.push({
          $or: [
            { subscription_status: 'canceled' },
            { subscription_renew_date: { $lt: new Date(currentDateTime) } },
          ],
        });
      }

      if (
        _.has(param, 'listed_user_ids') &&
        !_.isEmpty(param.listed_user_ids)
      ) {
        // and_clauses.push({
        //     "_id": { $all: param.listed_user_ids }
        // });
        and_clauses.push({
          _id: { $in: param.listed_user_ids },
        });
      }

      and_clauses.push({
        isVerified: true,
        status: 'Active',
        isDeleted: false,
      });

      if (
        _.has(param, 'category_id') &&
        param.category_id != '' &&
        param.category_id != null
      ) {
        and_clauses.push({
          category_id: mongoose.Types.ObjectId(param.category_id),
        });
      }

      if (
        _.has(param, 'body_type_id') &&
        param.body_type_id != '' &&
        param.body_type_id != null
      ) {
        and_clauses.push({
          body_type_id: mongoose.Types.ObjectId(param.body_type_id),
        });
      }

      if (
        _.has(param, 'gender') &&
        param.gender != '' &&
        param.gender != null
      ) {
        and_clauses.push({ gender: { $regex: param.gender, $options: 'i' } });
      }

      if (
        _.has(param, 'height') &&
        param.height != '' &&
        param.height != null &&
        _.has(param, 'height_unit') &&
        param.height_unit != '' &&
        param.height_unit != null
      ) {
        and_clauses.push({
          height: parseFloat(param.height),
          height_unit: param.height_unit,
        });
      }

      if (
        _.has(param, 'location') &&
        param.location != '' &&
        param.location != null
      ) {
        and_clauses.push({
          $or: [
            { location: { $regex: param.location, $options: 'i' } },
            { city: { $regex: param.location, $options: 'i' } },
            { state: { $regex: param.location, $options: 'i' } },
            { country: { $regex: param.location, $options: 'i' } },
          ],
        });
      }

      conditions['$and'] = and_clauses;

      var result = await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'subscribe_user_id',
            as: 'subscriptions',
          },
        },
        { $unwind: '$subscriptions' },
        {
          $match: {
            'subscriptions.subscriber_user_id': mongoose.Types.ObjectId(
              param.logged_in_user,
            ),
          },
        },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            location: '$location',
            wallet_balance: '$wallet_balance',
            short_dec: '$short_dec',
            category_id: '$category_id',
            profile_pic: '$profile_pic',
            cover_image: '$cover_image',
            height: '$height',
            height_unit: '$height_unit',
            privacy_settings: {
              show_in_search_result: {
                $ifNull: ['$privacy_settings.show_in_search_result', true],
              },
              show_activity_status: {
                $ifNull: ['$privacy_settings.show_activity_status', true],
              },
              show_subscription_offers: {
                $ifNull: ['$privacy_settings.show_subscription_offers', true],
              },
              allow_co_streaming_request: {
                $ifNull: [
                  '$privacy_settings.allow_co_streaming_request',
                  'nobody',
                ],
              },
            },
            register_type: '$register_type',
            isVerified: '$isVerified',
            lastLogoutTime: '$lastLogoutTime',
            loginStatus: '$loginStatus',
            activityStatus: '$activityStatus',
            canReceiveCall: '$canReceiveCall',
            subscription_id: '$subscriptions._id',
            subscription_amount: '$subscription_amount',
            subscription_start_date: '$subscriptions.subscription_start_date',
            subscription_renew_date: '$subscriptions.subscription_end_date',
            subscription_end: '$subscriptions.subscription_end',
            subscription_auto_renew: '$subscriptions.auto_renew',
            subscription_status: '$subscriptions.status',
            subscription_info: '$subscriptions',
            isSubscribe: '$isSubscribe',
            bank_account_added: '$bank_account_added',
            live: '$live',
            isDeleted: '$isDeleted',
            status: '$status',
            role: '$user_role',
          },
        },
        {
          $group: {
            _id: '$_id',
            full_name: { $last: '$full_name' },
            username: { $last: '$username' },
            location: { $last: '$location' },
            wallet_balance: { $last: '$wallet_balance' },
            short_dec: { $last: '$short_dec' },
            category_id: { $last: '$category_id' },
            profile_pic: { $last: '$profile_pic' },
            cover_image: { $last: '$cover_image' },
            height: { $last: '$height' },
            height_unit: { $last: '$height_unit' },
            privacy_settings: { $last: '$privacy_settings' },
            register_type: { $last: '$register_type' },
            isVerified: { $last: '$isVerified' },
            lastLogoutTime: { $last: '$lastLogoutTime' },
            loginStatus: { $last: '$loginStatus' },
            activityStatus: { $last: '$activityStatus' },
            canReceiveCall: { $last: '$canReceiveCall' },
            subscription_id: { $last: '$subscription_id' },
            subscription_amount: { $last: '$subscription_amount' },
            subscription_start_date: { $last: '$subscription_start_date' },
            subscription_renew_date: { $last: '$subscription_renew_date' },
            subscription_end: { $last: '$subscription_end' },
            subscription_auto_renew: { $last: '$subscription_auto_renew' },
            subscription_status: { $last: '$subscription_status' },
            subscription_info: { $last: '$subscription_info' },
            isSubscribe: { $last: '$isSubscribe' },
            bank_account_added: { $last: '$bank_account_added' },
            live: { $last: '$live' },
            isDeleted: { $last: '$isDeleted' },
            status: { $last: '$status' },
            role: { $last: '$role' },
          },
        },
        { $match: conditions },
      ]);

      return result;
    } catch (e) {
      return e;
    }
  },

  getById: async (id, select = '-password') => {
    try {
      let user = await User.findById(id).select(select).exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  findOne: async (params) => {
    let user = await User.findOne(params);
    try {
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  find: async (params) => {
    let user = await User.find(params);
    try {
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getByIdWithName: async (id) => {
    try {
      let user = await User.findById(id)
        .select(['_id', 'full_name', 'username'])
        .exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getByField: async (params) => {
    try {
      let user = await User.findOne(params).exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getAllByField: async (params) => {
    try {
      let cat = await User.find(params).sort({ _id: 1 }).exec();
      if (!cat) {
        return null;
      }
      return cat;
    } catch (e) {
      return e;
    }
  },

  getLimitUserByField: async (params) => {
    try {
      let user = await User.find(params)
        .populate('role')
        .limit(5)
        .sort({
          _id: -1,
        })
        .exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  delete: async (id) => {
    try {
      let user = await User.findById(id);
      if (user) {
        let userDelete = await User.remove({
          _id: id,
        }).exec();
        if (!userDelete) {
          return null;
        }
        return userDelete;
      }
    } catch (e) {
      return e;
    }
  },

  deleteByField: async (field, fieldValue) => {
    //todo: Implement delete by field
  },

  updateById: async (data, id) => {
    try {
      let user = await User.findByIdAndUpdate(id, data, { new: true });
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      console.log(e);
      return e;
    }
  },

  updateByField: async (field, fieldValue, data) => {
    try {
      let user = await User.findByIdAndUpdate(fieldValue, field, {
        new: true,
      });
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  updateByParam: async (query, updateObj) => {
    let users = await User.updateMany(query, updateObj, {
      upsert: false,
    }).exec();

    if (!users) {
      return null;
    }
    return users;
  },

  save: async (data) => {
    try {
      let user = await User.create(data);

      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      throw e;
    }
  },

  forgotPassword: async (params) => {
    try {
      let user = await User.findOne({ email: params.email }).exec();
      if (!user) {
        throw {
          status: 500,
          data: null,
          message: 'Authentication failed. User not found.',
        };
      } else if (user) {
        let random_pass = Math.random().toString(36).substr(2, 9);
        let readable_pass = random_pass;
        random_pass = user.generateHash(random_pass);
        let user_details = await User.findByIdAndUpdate(user._id, {
          password: random_pass,
        }).exec();
        if (!user_details) {
          throw { status: 500, data: null, message: 'User not found.' };
        } else {
          throw {
            status: 200,
            data: readable_pass,
            message: 'Mail is sending to your mail id with new password',
          };
        }
        //return readable_pass;
      }
    } catch (e) {
      return e;
    }
  },

  getUser: async (id) => {
    try {
      let user = await User.findOne({ id }).exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getUserByField: async (data) => {
    try {
      let user = await User.findOne(data).populate('role').exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getUserForAuthentication: async (data) => {
    const user = await User.findOne(data).select('+password').exec();
    return user;
  },

  getUserDetail: async (param) => {
    try {
      return await User.aggregate([
        { $match: param },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        {
          $lookup: {
            from: 'body_types',
            localField: 'body_type_id',
            foreignField: '_id',
            as: 'body_types',
          },
        },
        {
          $unwind: {
            path: '$body_types',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'ethnicities',
            localField: 'ethnicity_id',
            foreignField: '_id',
            as: 'ethnicities',
          },
        },
        {
          $unwind: {
            path: '$ethnicities',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            phone: '$phone',
            email: '$email',
            location: '$location',
            city: '$city',
            state: '$state',
            country: '$country',
            website_url: '$website_url',
            wallet_balance: '$wallet_balance',
            short_dec: '$short_dec',
            category_id: '$category_id',
            profile_pic: '$profile_pic',
            cover_image: '$cover_image',
            gender: '$gender',
            height: '$height',
            height_unit: '$height_unit',
            verification_code: '$verification_code',
            social_id: '$social_id',
            referred_by: '$referred_by',
            rewards: '$rewards',
            register_type: '$register_type',
            isVerified: '$isVerified',
            subscription_amount: '$subscription_amount',
            isSubscribe: '$isSubscribe',
            bank_account_added: '$bank_account_added',
            lastLogoutTime: '$lastLogoutTime',
            loginStatus: '$loginStatus',
            activityStatus: '$activityStatus',
            live: '$live',
            session_id: '$session_id',
            isDeleted: '$isDeleted',
            email_notification: '$email_notification',
            push_notification: '$push_notification',
            site_notifications: '$site_notifications',
            site_toaster_notification: '$site_toaster_notification',
            privacy_settings: '$privacy_settings',
            availableForBooking: { $ifNull: ['$availableForBooking', false] },
            canReceiveCall: { $ifNull: ['$canReceiveCall', false] },
            canAddSubscriptionPromotion: {
              $ifNull: ['$canAddSubscriptionPromotion', true],
            },
            status: '$status',
            role: '$user_role',
            access_token: '$access_token',
            body_type_id: { $ifNull: ['$body_type_id', null] },
            ethnicity_id: { $ifNull: ['$ethnicity_id', null] },
            body_type: { $ifNull: ['$body_types', {}] },
            ethnicity: { $ifNull: ['$ethnicities', {}] },
          },
        },
      ]).exec();
    } catch (e) {
      return e;
    }
  },

  getUserNotificationSettings: async (param) => {
    try {
      return await User.aggregate([
        { $match: param },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            email: '$email',
            live: '$live',
            email_notification: '$email_notification',
            push_notification: '$push_notification',
            site_notifications: {
              new_campaign_contribution: {
                $ifNull: [
                  '$site_notifications.new_campaign_contribution',
                  false,
                ],
              },
              new_comment: {
                $ifNull: ['$site_notifications.new_comment', false],
              },
              new_like: { $ifNull: ['$site_notifications.new_like', false] },
              discounts_from_user_i_used_to_follow: {
                $ifNull: [
                  '$site_notifications.discounts_from_user_i_used_to_follow',
                  false,
                ],
              },
              new_subscriber: {
                $ifNull: ['$site_notifications.new_subscriber', false],
              },
              new_tip: { $ifNull: ['$site_notifications.new_tip', false] },
            },
            site_toaster_notification: {
              new_campaign_contribution: {
                $ifNull: [
                  '$site_toaster_notification.new_campaign_contribution',
                  false,
                ],
              },
              new_comment: {
                $ifNull: ['$site_toaster_notification.new_comment', false],
              },
              new_like: {
                $ifNull: ['$site_toaster_notification.new_like', false],
              },
              discounts_from_user_i_used_to_follow: {
                $ifNull: [
                  '$site_toaster_notification.discounts_from_user_i_used_to_follow',
                  false,
                ],
              },
              new_subscriber: {
                $ifNull: ['$site_toaster_notification.new_subscriber', false],
              },
              new_tip: {
                $ifNull: ['$site_toaster_notification.new_tip', false],
              },
            },
          },
        },
      ]).exec();
    } catch (e) {
      return e;
    }
  },

  getUserPrivacySettings: async (param) => {
    try {
      return await User.aggregate([
        { $match: param },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            email: '$email',
            privacy_settings: {
              show_in_search_result: {
                $ifNull: ['$privacy_settings.show_in_search_result', false],
              },
              show_activity_status: {
                $ifNull: ['$privacy_settings.show_activity_status', false],
              },
              show_subscription_offers: {
                $ifNull: ['$privacy_settings.show_subscription_offers', false],
              },
              allow_co_streaming_request: {
                $ifNull: [
                  '$privacy_settings.allow_co_streaming_request',
                  'nobody',
                ],
              },
            },
          },
        },
      ]).exec();
    } catch (e) {
      return e;
    }
  },

  getUsersByField: async (data) => {
    try {
      let user = await User.find(data).populate('role').exec();
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      return e;
    }
  },

  getUserCountByParam: async (params) => {
    try {
      let user = await User.countDocuments(params);
      return user;
    } catch (e) {
      throw e;
    }
  },

  getUsersCount: async (req) => {
    try {
      var conditions = {
        status: 'Active',
      };
      var and_clauses = [];

      and_clauses.push({
        isDeleted: false,
      });
      and_clauses.push({
        'user_role.role': {
          $ne: 'admin',
        },
      });

      conditions['$and'] = and_clauses;
      let users = await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        {
          $unwind: '$user_role',
        },
        {
          $match: conditions,
        },
        {
          $group: {
            _id: '$user_role._id',
            name: {
              $first: '$user_role.role',
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]).exec();
      return users;
    } catch (e) {
      throw e;
    }
  },

  getUserCustomDataById: async (param) => {
    try {
      return await User.aggregate([
        { $match: param },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            availableForBooking: { $ifNull: ['$availableForBooking', false] },
            status: '$status',
          },
        },
      ]).exec();
      return user;
    } catch (e) {
      return e;
    }
  },

  getAllPerformersByFanCount: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];
      let currentDateTime = moment().utc().format('YYYY-MM-DD');

      and_clauses.push({
        isSubscribe: true,
        bank_account_added: true,
        status: 'Active',
        isDeleted: false,
        'user_role.role': 'performer',
        'privacy_settings.show_in_search_result': true,
      });

      if (
        _.has(param, 'subscribed_performer_ids') &&
        !_.isEmpty(param.subscribed_performer_ids)
      ) {
        //copied
        and_clauses.push({
          _id: { $nin: param.subscribed_performer_ids },
        });
      }

      // and_clauses.push({
      // 	"subscriptions.subscription_start_date": { $lte: new Date(currentDateTime) },
      //     "subscriptions.subscription_end_date": { $gte: new Date(currentDateTime) },
      //     "subscriptions.status": 'active'
      // });

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },
        // {
        //     $lookup: {
        //         "from": "subscriptions",
        //         "localField": "_id",
        //         "foreignField": "subscribe_user_id",
        //         "as": "subscriptions"
        //     }
        // },
        // { "$unwind": "$subscriptions" },
        { $match: conditions },
        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            phone: '$phone',
            email: '$email',
            profile_pic: '$profile_pic',
            cover_image: '$cover_image',
            role: '$user_role.role',
            location: '$location',
            website_url: '$website_url',
            isVerified: '$isVerified',
            isSubscribe: '$isSubscribe',
            bank_account_added: '$bank_account_added',
            lastLogoutTime: '$lastLogoutTime',
            loginStatus: '$loginStatus',
            activityStatus: '$activityStatus',
            canReceiveCall: '$canReceiveCall',
            status: '$status',
            isDeleted: '$isDeleted',
            privacy_settings: {
              show_in_search_result: {
                $ifNull: ['$privacy_settings.show_in_search_result', false],
              },
              show_activity_status: {
                $ifNull: ['$privacy_settings.show_activity_status', false],
              },
              show_subscription_offers: {
                $ifNull: ['$privacy_settings.show_subscription_offers', false],
              },
              allow_co_streaming_request: {
                $ifNull: [
                  '$privacy_settings.allow_co_streaming_request',
                  'nobody',
                ],
              },
            },
          },
        },
        // {
        //     $group: {
        //         "_id": "$_id",
        //         "full_name": { $first: "$full_name" },
        //         "username": { $first: "$username" },
        //         "phone": { $first: "$phone" },
        //         "email": { $first: "$email" },
        //         "profile_pic": { $first: "$profile_pic" },
        //         "cover_image": { $first: "$cover_image" },
        //         "role": { $first: "$role" },
        //         "location": { $first: "$location" },
        //         "website_url": { $first: "$website_url" },
        //         "isVerified": { $first: "$isVerified" },
        //         "isSubscribe": { $first: "$isSubscribe" },
        //         "bank_account_added": { $first: "$bank_account_added" },
        //         "status": { $first: "$status" },
        //         "isDeleted": { $first: "$isDeleted" },
        //         "subscriber_id":{ $addToSet: "$subscriber_id" }
        //     }
        // }
      ]).exec();
    } catch (e) {
      throw e;
    }
  },
  getAllUsersByParam: async (param) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({
        status: 'Active',
        isDeleted: false,
        isVerified: true,
        role: { $ne: 'admin' },
        'site_notifications.new_campaign_contribution': true,
      });

      if (
        _.has(param, 'active_subscribers') &&
        !_.isEmpty(param.active_subscribers)
      ) {
        //copied
        and_clauses.push({
          _id: { $nin: param.active_subscribers },
        });
      }

      if (_.has(param, 'exclude_user_id') && param.exclude_user_id != '') {
        //copied
        and_clauses.push({
          _id: { $ne: mongoose.Types.ObjectId(param.exclude_user_id) },
        });
      }

      if (_.has(param, 'user_last_logout') && param.user_last_logout != '') {
        //copied
        and_clauses.push({
          lastLogoutTime: { $gte: new Date(param.user_last_logout) },
        });
      }

      conditions['$and'] = and_clauses;

      return await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },

        {
          $project: {
            _id: '$_id',
            full_name: '$full_name',
            username: '$username',
            email: '$email',
            role: '$user_role.role',
            isVerified: '$isVerified',
            bank_account_added: '$bank_account_added',
            lastLogoutTime: '$lastLogoutTime',
            loginStatus: '$loginStatus',
            status: '$status',
            isDeleted: '$isDeleted',
            endpoint: '$endpoint',
            pdh: '$pdh',
            auth: '$auth',
            email_notification: '$email_notification',
            push_notification: '$push_notification',
            site_notifications: {
              new_campaign_contribution: {
                $ifNull: [
                  '$site_notifications.new_campaign_contribution',
                  false,
                ],
              },
              discounts_from_user_i_used_to_follow: {
                $ifNull: [
                  '$site_notifications.discounts_from_user_i_used_to_follow',
                  false,
                ],
              },
            },
            site_toaster_notification: {
              new_campaign_contribution: {
                $ifNull: [
                  '$site_toaster_notification.new_campaign_contribution',
                  false,
                ],
              },
            },
          },
        },
        { $match: conditions },
      ]).exec();
    } catch (e) {
      throw e;
    }
  },

  getPerformerUserData: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];
      and_clauses.push({
        status: 'Active',
        isDeleted: false,
        _id: { $ne: mongoose.Types.ObjectId(req.user._id) },
        'user_role.role': 'performer',
      });

      if (
        !_.isNull(req.body.name) &&
        !_.isUndefined(req.body.name) &&
        req.body.name != ''
      ) {
        and_clauses.push({
          $or: [
            { full_name: { $regex: req.body.name, $options: 'i' } },
            { email: { $regex: req.body.name, $options: 'i' } },
          ],
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

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        {
          $unwind: '$user_role',
        },

        {
          $match: conditions,
        },
        sortOperator,
      ]);

      var options = {
        page: req.body.page,
        limit: req.body.limit,
      };

      let allUsers = await User.aggregatePaginate(aggregate, options);

      return allUsers;
    } catch (e) {
      throw e;
    }
  },

  getAllFamilyUsers: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({ isDeleted: false });
      and_clauses.push({ role: req.body.role });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        and_clauses.push({
          $or: [
            {
              full_name: {
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
            {
              phone: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              signup_date: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              last_login_date_string: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        if (req.body.query.Status == 'Active') {
          and_clauses.push({ status: 'Active' });
        }
        if (req.body.query.Status == 'Inactive') {
          and_clauses.push({ status: 'Inactive' });
        }
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };
      if (_.has(req.body, 'sort')) {
        var sortField = req.body.sort.field;
        if (req.body.sort.field == 'signup_date') {
          sortField = 'createdAt';
        }

        if (req.body.sort.sort == 'desc') {
          var sortOrder = -1;
        } else if (req.body.sort.sort == 'asc') {
          var sortOrder = 1;
        }
        sortOperator['$sort'][sortField] = sortOrder;
      } else {
        sortOperator['$sort']['_id'] = -1;
      }

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },

        {
          $group: {
            _id: '$_id',
            profile_pic: { $first: '$profile_pic' },
            full_name: { $first: '$full_name' },
            email: { $first: '$email' },
            phone: { $first: '$phone' },
            role: { $first: '$user_role.role' },
            status: { $first: '$status' },
            createdAt: { $first: '$createdAt' },
            isDeleted: { $first: '$isDeleted' },
          },
        },
        {
          $project: {
            _id: '$_id',
            profile_pic: '$profile_pic',
            full_name: '$full_name',
            email: '$email',
            phone: '$phone',
            role: '$role',
            status: '$status',
            createdAt: '$createdAt',
            signup_date: {
              $dateToString: { format: '%m-%d-%Y', date: '$createdAt' },
            },
            isDeleted: '$isDeleted',
          },
        },
        {
          $addFields: {
            last_login_month: {
              $let: {
                vars: {
                  monthsInString: [
                    ,
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                  ],
                },
                in: {
                  $arrayElemAt: ['$$monthsInString', '$last_login_month'],
                },
              },
            },
          },
        },
        {
          $addFields: {
            last_login_date_string: {
              $concat: ['$last_login_month', ' ', '$last_login_date'],
            },
          },
        },
        {
          $addFields: {
            last_login_date_string: {
              $ifNull: ['$last_login_date_string', 'N/A'],
            },
          },
        },
        { $match: conditions },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allUsers = await User.aggregatePaginate(aggregate, options);
      return allUsers;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  },

  getAllFamilyMembers: async (req) => {
    try {
      var conditions = {};
      var and_clauses = [];

      and_clauses.push({ isDeleted: false });
      and_clauses.push({ 'user_role.role': req.body.role });
      and_clauses.push({ parent_id: mongoose.Types.ObjectId(req.params.id) });

      if (
        _.isObject(req.body.query) &&
        _.has(req.body.query, 'generalSearch')
      ) {
        and_clauses.push({
          $or: [
            {
              full_name: {
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
            {
              phone: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              signup_date: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
            {
              last_login_date_string: {
                $regex: req.body.query.generalSearch.replace(/^\s+|\s+$/gm, ''),
                $options: 'i',
              },
            },
          ],
        });
      }
      if (_.isObject(req.body.query) && _.has(req.body.query, 'Status')) {
        if (req.body.query.Status == 'Active') {
          and_clauses.push({ status: 'Active' });
        }
        if (req.body.query.Status == 'Inactive') {
          and_clauses.push({ status: 'Inactive' });
        }
      }

      conditions['$and'] = and_clauses;

      var sortOperator = { $sort: {} };
      if (_.has(req.body, 'sort')) {
        var sortField = req.body.sort.field;
        if (req.body.sort.field == 'signup_date') {
          sortField = 'createdAt';
        }

        if (req.body.sort.sort == 'desc') {
          var sortOrder = -1;
        } else if (req.body.sort.sort == 'asc') {
          var sortOrder = 1;
        }
        sortOperator['$sort'][sortField] = sortOrder;
      } else {
        sortOperator['$sort']['_id'] = -1;
      }

      var aggregate = User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'user_role',
          },
        },
        { $unwind: '$user_role' },

        {
          $project: {
            _id: '$_id',
            profile_pic: '$profile_pic',
            full_name: '$full_name',
            email: '$email',
            phone: '$phone',
            user_role: '$user_role',
            parent_id: '$parent_id',
            role: '$role',
            status: '$status',
            createdAt: '$createdAt',
            signup_date: {
              $dateToString: { format: '%m-%d-%Y', date: '$createdAt' },
            },
            isDeleted: '$isDeleted',
          },
        },
        { $match: conditions },
        sortOperator,
      ]);

      var options = {
        page: req.body.pagination.page,
        limit: req.body.pagination.perpage,
      };
      let allUsers = await User.aggregatePaginate(aggregate, options);
      return allUsers;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  },
};

module.exports = userRepository;
