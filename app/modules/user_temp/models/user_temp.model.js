const mongoose = require('mongoose');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
// define the schema for our user model
var Schema = mongoose.Schema;

const statustype = ['Active', 'Inactive'];
const deleted = [true, false];

var UserSchema = new Schema(
  {
    parent_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    atheletic_id: {
      type: Schema.Types.ObjectId,
      ref: 'Athlete',
      default: null,
    },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    status: { type: String, default: 'Active', enum: statustype },
    isDeleted: { type: Boolean, default: false, enum: deleted },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('User_temp', UserSchema);
