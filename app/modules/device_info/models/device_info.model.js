const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

const DeviceInfoSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uniqueId: { type: String, required: true },
    deviceName: { type: String, required: true },
    systemName: { type: String, required: true },
    systemVersion: { type: String, required: true },
    deviceInfo: { type: Object },
    fcmToken: { type: String, default: '' },
    fcmAspnToken: { type: String, default: '' },
    lastLoggedIn: Date,
    lastActiveOn: Date,
  },
  { timestamps: true, versionKey: false },
);

// For pagination
DeviceInfoSchema.plugin(mongooseAggregatePaginate);

// create the model for users and expose it to our app
module.exports = mongoose.model('device_info', DeviceInfoSchema);
