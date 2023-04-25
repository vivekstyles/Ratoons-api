const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;
const InviteSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    referralCode: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inviteType: {
      type: String,
      enum: ['partner-invite', 'fan-invite'],
      required: true,
    },
    invitedVia: {
      type: String,
      enum: ['email', 'sms', 'link'],
      default: 'link',
    },
    status: {
      type: String,
      enum: [
        'pending', //request intiated
        'accepted', //accepted by partner
        'rejected', //rejected by partner
        'cancelled', //cancelled by scorekeeper before partner has accepted/rejected
        'confirmed', //confirmed by scorekeeper after partner accepted
        'declined', //declined by scorekeeper after partner accepted
        'removed', // removed by scorekeeper if partner don't want
      ],
      default: 'pending',
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);
InviteSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Invites', InviteSchema);
