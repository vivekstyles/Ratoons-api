const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const { ObjectId } = require('bson');
const RecruiterJobPostSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => new ObjectId().toString(), required: true },
    user: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'content',
        'content-link',
        'content-image',
        'content-image-link',
        'content-file',
        'content-file-link'
      ],
      required: true,
    },
    // sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalLink:{type: String, required: false},
    image:{type:String,default:false},
    file:{type:String,default:false},
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);
RecruiterJobPostSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Recruiter_job_post', RecruiterJobPostSchema);
