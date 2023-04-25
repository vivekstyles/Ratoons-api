const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

const statustype = ['Enabled', 'Suspended'];

const generalSettingSchema = new Schema(
  {
    site_title: { type: String, default: '' },
    site_email: { type: String, default: '' },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    isDeleted: { type: Boolean, default: false, enum: [true, false] },
  },
  { timestamps: true },
);

// For pagination
generalSettingSchema.plugin(mongooseAggregatePaginate);

// create the model for Coupon and expose it to our app
module.exports = mongoose.model('General_Setting', generalSettingSchema);
