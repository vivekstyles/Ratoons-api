const OtpModel = require('../models/otp.model');
const otpRepo = {
  create: async (data) => {
    try {
      return OtpModel.create(data);
    } catch (e) {
      throw e;
    }
  },

  findByOtp: async (otp) => {
    try {
      return OtpModel.findOne({ otp: otp });
    } catch (e) {
      throw e;
    }
  },

  findOne: async (data) => {
    try {
      return OtpModel.findOne(data);
    } catch (e) {
      throw e;
    }
  },

  expirePreviousOtps: async (user, type) => {
    try {
      return OtpModel.updateMany(
        { user: user, isActive: true, type: type },
        { $set: { isActive: false } },
      );
    } catch (e) {
      throw e;
    }
  },
};
module.exports = otpRepo;
