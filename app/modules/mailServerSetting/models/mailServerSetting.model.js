const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

const status = ['Active', 'Inactive'];

const mailServerSettingSchema = new Schema(
  {
    smtp_server: { type: String, default: '' },
    port: { type: String, default: '' },
    email: { type: String, default: '' },
    password: { type: String, default: '' },
    status: { type: String, default: 'Active', enum: status },
  },
  { timestamps: true },
);

// For pagination
mailServerSettingSchema.plugin(mongooseAggregatePaginate);

// create the model for users and expose it to our app
module.exports = mongoose.model('mail_server_setting', mailServerSettingSchema);
