const deviceInfo = require('device_info/models/device_info.model');

const DeviceInfoRepository = {
  findOne: async (params) => {
    return deviceInfo.findOne(params);
  },
  //Update or insert device info for user
  upsert: async (userId, deviceDetails) => {
    try {
      return deviceInfo.findOneAndUpdate(
        { user: userId, uniqueId: deviceDetails.uniqueId },
        {
          deviceInfo: deviceDetails,
          deviceName: deviceDetails.deviceName,
          systemName: deviceDetails.systemName,
          systemVersion: deviceDetails.systemVersion,
          lastLoggedIn: new Date(),
          lastActiveOn: new Date(),
        },
        { upsert: true, new: true },
      );
    } catch (e) {
      throw e;
    }
  },

  getDeviceFCMTokens: async (userIds) => {
    try {
      const tokens = await deviceInfo
        .find({
          user: { $in: userIds },
          fcmToken: { $ne: null },
        })
        .distinct('fcmToken');
      return tokens;
    } catch (e) {
      throw e;
    }
  },

  clearPreviousUserTokens: async (deviceId, userId) => {
    return deviceInfo.updateMany(
      { uniqueId: deviceId, user: { $ne: userId }, fcmToken: { $ne: null } },
      { $set: { fcmToken: '', fcmAspnToken: '' } },
    );
  },

  clearUserTokens: async (userId, deviceId) => {
    return deviceInfo.updateMany(
      { user: userId, deviceId: deviceId },
      { $set: { fcmToken: '', fcmAspnToken: '' } },
    );
  },
};

module.exports = DeviceInfoRepository;
