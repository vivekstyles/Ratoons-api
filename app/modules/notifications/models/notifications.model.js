const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'game-schedule',
        'fan-requested', // Request to add as a fan from another scorekeeper
        'fan-accepted', // Request sent to user invited fan accepts the request sent by the user
        'fan-rejected',
        'partner-requested',
        'partner-accepted',
        'partner-rejected',
        'partner-confirmed',
        'partner-declined',
        'partner-removed',
      ],
      required: true,
    },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invites',
    },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);
NotificationSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Notification', NotificationSchema);
