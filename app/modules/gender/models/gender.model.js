const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

const GenderSchema = new Schema(
  {
    title: { type: String, default: '' },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    isDeleted: { type: Boolean, default: false, enum: [true, false] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

// For pagination
GenderSchema.plugin(mongooseAggregatePaginate);

// create the model for users and expose it to our app
module.exports = mongoose.model('Gender', GenderSchema);
