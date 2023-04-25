const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const status = ['Active', 'Inactive'];

const FaqSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true, enum: [true, false] },
    isDeleted: { type: Boolean, default: false, enum: [true, false] },
  },
  { timestamps: true, versionKey: false },
);

// For pagination
FaqSchema.plugin(mongoosePaginate);

// create the model for users and expose it to our app
module.exports = mongoose.model('Faq', FaqSchema);
