var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const config = require('../../../config');
const devicetype = ['android', 'ios'];
const isLive = [true, false];
const notification = [true, false];
const registertype = ['normal', 'social'];
const statustype = ['Active', 'Inactive', 'Banned', 'Suspended'];
const deleted = [true, false];
const gendertype = ['Men', 'Women', 'Transgender', 'Shemale'];
const heightUnit = ['Feet', 'Inches'];
const co_streaming_request = ['nobody', 'mutual_friends', 'subscribers'];

var UserSchema = new Schema(
  {
    full_name: { type: String, default: '', required: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    atheletic_id: {
      type: Schema.Types.ObjectId,
      ref: 'Athlete',
      default: null,
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '', required: true, unique: true },
    password: { type: String, default: '', private: true },
    profile_pic: {
      type: String,
      default: '',
      transform: function (v) {
        if (!v) return v;
        return `${config.ASSET_URL}${v}`;
      },
    },
    verification_code: { type: Number, default: null },
    facebook_id: { type: String, default: '' },
    google_id: { type: String, default: '' },
    apple_id: { type: String, default: '' },
    register_type: { type: String, default: 'normal', enum: registertype },
    parent_id: { type: [Schema.Types.ObjectId], ref: 'User', default: null },
    partner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    color_theme: { type: String, default: 'light', enum: ['light', 'dark'] },
    referral_code: { type: Number, default: null },
    partner_code: { type: String, default: null },
    fan_code: { type: String, default: null },
    push_notification: { type: Boolean, default: false },
    email_notification: { type: Boolean, default: false },
    sms_notification: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isVerifyEmail: { type: Boolean, default: false },
    status: { type: String, default: 'Active', enum: statustype },
    isDeleted: { type: Boolean, default: false, enum: deleted },
    notificationCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

// generating a hash
UserSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function (password, checkPassword) {
  return bcrypt.compareSync(password, checkPassword);
  //bcrypt.compare(jsonData.password, result[0].pass
};

// For pagination
UserSchema.plugin(mongooseAggregatePaginate);

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);
