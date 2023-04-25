const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const CmsSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, required: true },
    isDeleted: { type: Boolean, default: false, enum: [true, false] },
    isActive: { type: Boolean, default: true, enum: [true, false] },
  },
  { timestamps: true, versionKey: false },
);

CmsSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Cms', CmsSchema);
