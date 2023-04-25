const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const MetaDataSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['family-members', 'military-discount'],
    },
    subTitle: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, collection: 'meta_data' },
);
MetaDataSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('MetaData', MetaDataSchema);
