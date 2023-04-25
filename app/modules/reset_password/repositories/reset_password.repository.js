const ResetPassword = require('reset_password/models/reset_password.model');
const resetPassword = {
  create: async (data) => {
    try {
      return ResetPassword.create(data);
    } catch (e) {
      throw e;
    }
  },
  findByToken: async (token) => {
    try {
      return ResetPassword.findOne({ token: token });
    } catch (e) {
      throw e;
    }
  },
  findOne: async (data) => {
    try {
      return ResetPassword.findOne(data);
    } catch (e) {
      throw e;
    }
  },
};
module.exports = resetPassword;
