const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    otp: { type: String, unique: true, required: true },
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'otp' },
);

module.exports = mongoose.model('otp', OtpSchema);
