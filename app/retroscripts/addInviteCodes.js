const userRepo = require('./../modules/user/repositories/user.repository');
const generateInviteCode = async () => {
  let isUniqueCode = false;
  do {
    const randomStr = Math.random().toString(36).substr(2, 6);
    const isExists = await userRepo.findOne({
      $or: [{ partner_code: randomStr }, { fan_code: randomStr }],
    });
    if (!isExists) {
      isUniqueCode = true;
      return randomStr;
    }
  } while (!isUniqueCode);
};
// updating users who does not have partner_code and fan_code
const addInviteCodesForUser = async () => {
  try {
    const users = await userRepo.find({
      $and: [
        { partner_code: { $exists: false } },
        { fan_code: { $exists: false } },
      ],
    });
    console.log('Total users', users.length);
    for (const [key, user] of Object.entries(users)) {
      user.partner_code = await generateInviteCode();
      user.fan_code = await generateInviteCode();
      console.log(`${key}: ${user.partner_code}`);
      console.log(`${key}: ${user.fan_code}`);
      await user.save();
    }
  } catch (error) {
    console.log('error found', error);
  }
};

module.exports = addInviteCodesForUser;
