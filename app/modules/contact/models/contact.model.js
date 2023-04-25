const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

const ContactSchema = new Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    isDeleted: { type: Boolean, default: false, enum: [true, false] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

// For pagination
ContactSchema.plugin(mongooseAggregatePaginate);

// create the model for users and expose it to our app
module.exports = mongoose.model('Contact', ContactSchema);
