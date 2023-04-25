const mongoose = require('mongoose');
// const userModel = mongoose.model('User');
const userRepo = require('user/repositories/user.repository');
const s3 = require('./aws/s3');
const resizeImg = require('../helper/imageResizer.js');

class Helper {
  constructor() {
    this.subscription = [];
  }

  async isNewUsernameAvailable(username) {
    try {
      var chkQuery = {
        username: username,
      };
      let userData = await userRepo.getByField(chkQuery);
      if (_.isEmpty(userData) || _.isNull(userData)) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw e;
    }
  }
  async isUsernameAvailable(username, user_id) {
    try {
      var chkQuery = {
        username: username,
        _id: { $ne: mongoose.Types.ObjectId(user_id) },
      };
      let userData = await userRepo.getByField(chkQuery);
      if (_.isEmpty(userData) || _.isNull(userData)) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw e;
    }
  }

  async createUsername(uname, attempt) {
    try {
      var chk_uname = uname;
      if (attempt > 0) {
        chk_uname = uname + attempt.toString();
      }
      var chkQuery = {
        username: { $regex: '^' + chk_uname.trim() + '$', $options: 'i' },
      };
      let userData = await userRepo.getByField(chkQuery);
      if (_.isEmpty(userData) || _.isNull(userData)) {
        return chk_uname;
      } else {
        attempt++;
        let nwStr = await this.createUsername(uname, attempt);
        return nwStr;
      }
    } catch (e) {
      throw e;
    }
  }

  async generateNewUsername(str) {
    var n = str.lastIndexOf('@');
    var new_str = str;
    if (n != -1) {
      new_str = new_str.substring(0, n);
    }
    new_str = new_str.replace(/[^a-zA-Z0-9]/g, '');
    let uname = await this.createUsername(new_str, 0);
    return uname;
  }

  async generateThumbImage(str) {
    var n = str.lastIndexOf('@');
    var new_str = str;
    if (n != -1) {
      new_str = new_str.substring(0, n);
    }
    new_str = new_str.replace(/[^a-zA-Z0-9]/g, '');
    let uname = await this.createUsername(new_str, 0);
    return uname;
  }

  async uploadFile(file, path, isThumb, resizePxl, prevFileName, newFileName) {
    const thumb = path + 'thumb/';
    if (prevFileName) {
      //Delete previous saved image and thumb image
      const oldFile = prevFileName.split('/');
      const fileName = oldFile[oldFile.length - 1];
      await s3.remove(path + fileName);
      isThumb && (await s3.remove(thumb + fileName));
    }
    //Upload original profile pic
    const response = await s3.upload(
      `${config.NODE_ENV}/${path}${newFileName}`,
      file.buffer,
      file.mimetype,
    );
    if (isThumb) {
      //Resize image and upload to thumb folder
      const resizedBuffer = await resizeImg(
        file.buffer,
        newFileName.split('.')[1],
        resizePxl,
      );
      await s3.upload(
        `${config.NODE_ENV}/${thumb}${newFileName}`,
        resizedBuffer,
        file.mimetype,
      );
    }
    return response;
  }

  validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  ucFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
  }
}

module.exports = new Helper();
