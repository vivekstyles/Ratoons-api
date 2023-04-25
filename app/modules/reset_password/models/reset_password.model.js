const uuidv1 = require('uuid').v1;
const mongoose = require('mongoose');

const ResetSchema = new mongoose.Schema(
  {
    token: { type: String, default: uuidv1, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
      default: 'email',
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Reset_Password', ResetSchema);
