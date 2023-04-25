const inviteModel = require('../models/invites.model');
const inviteRepo = {
  save: async (data) => {
    try {
      return inviteModel.create(data);
    } catch (e) {
      throw e;
    }
  },
  findById: async (id) => {
    try {
      return inviteModel.findById(id);
    } catch (e) {
      throw e;
    }
  },
  getByField: async (params) => {
    try {
      let invite = await inviteModel.findOne(params).exec();
      if (!invite) {
        return null;
      }
      return invite;
    } catch (e) {
      return e;
    }
  },
  findOne: async (params) => {
    try {
      return inviteModel.findOne(params);
    } catch (e) {
      throw e;
    }
  },
  getAll: async (filterParams, options) => {
    try {
      return inviteModel.paginate(filterParams, options);
    } catch (e) {
      throw e;
    }
  },
  find: async (params) => {
    try {
      return inviteModel.find(params);
    } catch (e) {
      throw e;
    }
  },
  findOneWithSelect: async (params, select) => {
    try {
      return inviteModel.findOne(params).select(select);
    } catch (e) {
      throw e;
    }
  },
  updateMany: async (Params, setParam) => {
    try {
      return inviteModel.updateMany(Params, { $set: setParam });
    } catch (e) {
      throw e;
    }
  },

  getPartnerInvite: async (userId) => {
    try {
      const invite = await inviteModel
        .findOne({
          invitedBy: userId,
          status: { $in: ['pending', 'accepted', 'confirmed'] },
          inviteType: 'partner-invite',
          isDeleted: false,
          isActive: true,
        })
        .select('name email phone status invitedVia user')
        .exec();
      if (invite?.user) {
        await invite.populate({
          path: 'user',
          select: 'profile_pic full_name',
        });
      }
      return invite;
    } catch (e) {
      throw e;
    }
  },
};
module.exports = inviteRepo;
