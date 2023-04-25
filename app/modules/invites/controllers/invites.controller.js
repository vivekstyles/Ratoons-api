const configs = require('../../../config');
const inviteRepo = require('../repositories/invites.repository');
const helper = require('../../../helper/helper');
const emailTemplate = require('../../../helper/email-templates');
const sns = require('../../../helper/aws/sns');
const userRepo = require('../../user/repositories/user.repository');
const notificationCont = require('../../notifications/controllers/notifications.controller');
// const subController = require('../../webservice/subscription.controller');
const deviceRepo = require('../../device_info/repositories/device_info.repository');
const fcm = require('../../../helper/firebase');
const { ucFirstLetter } = require('../../../helper/helper');
class InviteController {
  async generateInviteCode() {
    let isUniqueCode = false;
    do {
      const randomStr = Math.random().toString(36).substr(2, 6);
      const isExists = await inviteRepo.findOne({ referralCode: randomStr });
      if (!isExists) {
        isUniqueCode = true;
        return randomStr;
      }
    } while (!isUniqueCode);
  }

  async getInviteLink(user, inviteType) {
    try {
      const subRes = await subController.getSubscriptionStatus(user._id);
      if (!subRes || (subRes && !subRes.isSubActive)) {
        return {
          status: 403,
          message: "You don't have an active subscription",
        };
      }
      if (user.role?.role !== 'creator') {
        return { status: 403, message: 'You are not authorized to invite' };
      }
      const referralCode =
        inviteType === 'partner' ? user.partner_code : user.fan_code;
      const data = {
        name: user.full_name,
        subject: `Join as ${inviteType}`,
        message: `Hey! ${user.full_name} has invited you to join as a ${inviteType} in Social Score Keeper account. Tap the below link to join`,
        link: `${configs.SSK_WEB_URL}deeplink/invite*${referralCode}`,
      };
      return { status: 200, data: data, message: 'Invite link' };
    } catch (e) {
      throw e;
    }
  }

  async sendInvite(user, params) {
    try {
      if (['email', 'sms'].indexOf(params.type) === -1) {
        return {
          status: 400,
          message: 'Invalid invite type. Only email or sms is allowed',
        };
      }
      if (user.role?.role !== 'creator') {
        return { status: 403, message: 'You are not authorized to invite' };
      }
      const subRes = await subController.getSubscriptionStatus(user._id);
      if (!subRes || (subRes && !subRes.isSubActive)) {
        return {
          status: 403,
          message: "You don't have an active subscription",
        };
      }
      const referralCode =
        params.inviteType === 'partner' ? user.partner_code : user.fan_code;
      // send invite via email
      if (params.type === 'email') {
        if (!params.hasOwnProperty('email')) {
          return { status: 400, message: 'Email is required' };
        }
        return this.sendInviteEmail(user, params, referralCode);
      }
      // send invite via sms
      if (params.type === 'sms') {
        if (!params.hasOwnProperty('phone')) {
          return { status: 400, message: 'Phone is required' };
        }
        return this.sendInviteSms(user, params, referralCode);
      }
    } catch (e) {
      throw e;
    }
  }

  async sendPushNotifications(user, content) {
    //Find device tokens
    const deviceTokens = await deviceRepo.getDeviceFCMTokens([
      user._id.toString(),
    ]);
    await fcm({ ...content }, deviceTokens);
  }

  async sendNotifications(user, params, response) {
    const inviteType = params.inviteType == 'partner' ? 'Partner' : 'Fan';
    const userObj = user.toObject();
    const profilePic = userObj.profile_pic;
    const content = {
      title: `You have a ${inviteType} invite`,
      message: `You have a ${inviteType} invite from ${user.full_name}`,
      image: userObj.profile_pic || configs.DEFAULT_IMG,
    };
    const notificationRes = await notificationCont.create(user, {
      ...content,
      user: response.user,
      type: `${params.inviteType}-requested`,
      invite: response._id,
    });
    //Send push notifications
    const userData = await userRepo.getById(response.user);
    this.sendPushNotifications(userData, content);
    return notificationRes;
  }

  async sendInviteEmail(user, params, referralCode) {
    const link = `${configs.SSK_WEB_URL}deeplink/invite*${referralCode}`;
    params.email = params.email.toLowerCase().trim();
    //Validate email format
    if (!helper.validateEmail(params.email))
      return { status: 400, message: 'Invalid email format' };
    //Validate user account email and requested email are same
    if (user.email === params.email) {
      return {
        status: 400,
        message: 'Cannot send partner request to yourself',
      };
    }
    //Check if user has sent invite already
    const isInvited = await inviteRepo.findOne({
      email: params.email,
      invitedBy: user._id,
      inviteType: `${params.inviteType}-invite`,
      status: { $nin: ['rejected', 'cancelled'] },
      isActive: true,
    });
    if (isInvited) {
      return { status: 409, message: 'Invite sent already' };
    }
    //Check if invited user already exists in our system
    const invitedUser = await userRepo.getByField({
      email: params.email,
    });
    //Check if inviting user have and active subscription
    if (invitedUser) {
      const invitingUserSub = await subController.getSubscriptionStatus(
        invitedUser._id,
      );
      if (invitingUserSub && invitingUserSub.isSubActive) {
        return {
          status: 403,
          message: 'Cannot send invite to a subscribed user',
        };
      }
    }
    let inviteParams = {
      invitedBy: user._id,
      inviteType: params.inviteType + '-invite',
      referralCode: referralCode,
      name: params.name,
      email: params.email,
      invitedVia: 'email',
    };
    let name = params.name || '';
    if (invitedUser) {
      name = invitedUser.full_name;
      Object.assign(inviteParams, {
        user: invitedUser._id,
        name: invitedUser.full_name,
      });
    }
    //Add entry to invite collection
    const response = await inviteRepo.save(inviteParams);
    await emailTemplate.partnerInviteEmail(user.full_name, {
      email: params.email,
      name: name,
      inviteType: params.inviteType,
      link: link,
    });
    let notificationRes;
    if (invitedUser) {
      notificationRes = await this.sendNotifications(user, params, response);
    }
    return {
      status: 200,
      data: { inviteRes: response, notificationRes },
      message: 'Email sent successfully',
    };
  }

  async sendInviteSms(user, params, referralCode) {
    const link = `${configs.SSK_WEB_URL}deeplink/invite*${referralCode}`;
    //Validate if phone contains only number
    if (isNaN(params.phone)) {
      return { status: 400, message: 'Invalid mobile number' };
    }
    //Validate user account email and requested email are same
    if (user.phone === params.phone) {
      return {
        status: 400,
        message: 'Cannot send invite to a subscribed user',
      };
    }
    //Check if user has sent invite already to the phone number
    const isInvited = await inviteRepo.findOne({
      phone: params.phone,
      invitedBy: user._id,
      status: { $in: ['pending', 'accepted', 'confirmed'] },
      isActive: true,
    });
    if (isInvited) {
      return { status: 409, message: 'Invite sent already' };
    }
    //Check if invited user already exists in our system
    const invitedUser = await userRepo.getByField({ phone: params.phone });
    if (invitedUser) {
      const invitingUserSub = await subController.getSubscriptionStatus(
        invitedUser?._id,
      );
      if (invitingUserSub && invitingUserSub.isSubActive) {
        return { status: 403, message: 'Cannot invite a subscribed user' };
      }
    }
    let inviteParams = {
      invitedBy: user._id,
      inviteType: params.inviteType + '-invite',
      referralCode: referralCode,
      name: params.name,
      phone: params.phone,
      invitedVia: 'sms',
    };
    let name = params.name || '';
    if (invitedUser) {
      name = invitedUser.full_name;
      Object.assign(inviteParams, {
        user: invitedUser._id,
        name: invitedUser.full_name,
      });
    }
    //Add entry to invite collection
    const response = await inviteRepo.save(inviteParams);
    const message = `Hi${name ? ' ' + name : ''}, ${
      user.full_name
    } has invited you to join as ${
      params.inviteType
    } in Social Score Keeper. Click the link to join. ${link}`;
    await sns.sendMessage(params.phone, message);
    let notificationRes;
    if (invitedUser) {
      notificationRes = await this.sendNotifications(user, params, response);
    }
    return {
      status: 200,
      data: { inviteRes: response, notificationRes },
      message: 'Sms sent successfully',
    };
  }

  async respondToPartnerInvite(user, status, inviteId) {
    try {
      const inviteRes = await inviteRepo.findOne({
        _id: inviteId,
        status: 'pending',
        isDeleted: false,
        isActive: true,
        invitedBy: { $ne: user._id },
      });
      if (!inviteRes) {
        return { status: 404, message: 'Invite not found' };
      }
      const statusType = status ? 'accepted' : 'rejected';
      inviteRes.status = statusType;
      if (!inviteRes.user) {
        inviteRes.user = user._id;
      }
      await inviteRes.save();
      if (status) {
        // update rejected users status
        const getNotAccInvites = await inviteRepo.find({
          user: user._id,
          status: 'pending',
          isDeleted: false,
          isActive: true,
          _id: { $ne: inviteId },
        });
        await Promise.all(
          getNotAccInvites.map(async (inv) => {
            inv.status = 'rejected';
            inv.isActive = false;
            inv.isDeleted = true;
            let updatedUsers = await inv.save();
            let getUser = await userRepo.getById(inv.invitedBy);
            let rejInviteType = updatedUsers.inviteType.split('-')[0];
            let rejectMessage = `${user.full_name} has ${updatedUsers.status} your ${rejInviteType} invite`;
            let rejectTitle = `${ucFirstLetter(
              rejInviteType,
            )} Request ${ucFirstLetter(updatedUsers.status)}`;
            await notificationCont.create(user, {
              user: updatedUsers.invitedBy.toString(),
              title: rejectTitle,
              message: rejectMessage,
              type: `partner-rejected`,
              invite: updatedUsers.invitedBy,
            });
            const profile_pic = user.toObject().profile_pic;
            await this.sendPushNotifications(getUser, {
              title: rejectTitle,
              message: rejectMessage,
              image: profile_pic || configs.DEFAULT_IMG,
            });
          }),
        );
      }
      //Mark user notification as read
      const notification = await notificationCont.markAsReadByInviteId(
        user,
        inviteId,
      );
      const userId = inviteRes.invitedBy.toString();
      const inviteType = inviteRes.inviteType.split('-')[0];
      //Send notification to scorekeeper
      let message = `${user.full_name} has ${statusType} your ${inviteType} invite`;
      const title = `${ucFirstLetter(inviteType)} Request ${ucFirstLetter(
        statusType,
      )}`;
      const notifyRes = await notificationCont.create(user, {
        user: userId,
        title: title,
        message: message,
        type: `${inviteType}-${statusType}`,
        invite: inviteId,
      });
      await notificationCont.markInviteNotificationsAsRead(user._id);
      //Send push notifications
      const userData = await userRepo.getById(userId);
      const profilePic = user.toObject().profile_pic;
      this.sendPushNotifications(userData, {
        title: title,
        message: message,
        image: profilePic || configs.DEFAULT_IMG,
      });
      return {
        status: 200,
        data: {
          inviteRes: inviteRes,
          notifyRes: notifyRes.data,
        },
        message: 'Partner request updated',
      };
    } catch (e) {
      throw e;
    }
  }

  async respondToFanInvite(user, status, inviteId) {
    try {
      const inviteRes = await inviteRepo.findOne({
        _id: inviteId,
        status: 'pending',
        isDeleted: false,
        isActive: true,
        invitedBy: { $ne: user._id },
      });
      if (!inviteRes) {
        return { status: 404, message: 'Invite not found' };
      }
      const statusType = status ? 'accepted' : 'rejected';
      inviteRes.status = statusType;
      if (!inviteRes.user) {
        inviteRes.user = user._id;
      }
      await inviteRes.save();
      //Mark user notification as read
      const notification = await notificationCont.markAsReadByInviteId(
        user,
        inviteId,
      );
      const userId = inviteRes.invitedBy.toString();
      const inviteType = inviteRes.inviteType.split('-')[0];
      //Send notification to scorekeeper
      let message = `${user.full_name} has ${statusType} your ${inviteType} invite`;
      const title = `${ucFirstLetter(inviteType)} Request ${ucFirstLetter(
        statusType,
      )}`;
      const notifyRes = await notificationCont.create(user, {
        user: userId,
        title: title,
        message: message,
        type: `${inviteType}-${statusType}`,
        invite: inviteId,
      });
      await notificationCont.markInviteNotificationsAsRead(user._id);
      //Send push notifications
      const userData = await userRepo.getById(userId);
      const profilePic = user.toObject().profile_pic;
      this.sendPushNotifications(userData, {
        title: title,
        message: message,
        image: profilePic || configs.DEFAULT_IMG,
      });
      return {
        status: 200,
        data: {
          inviteRes: inviteRes,
          notifyRes: notifyRes.data,
        },
        message: 'Partner request updated',
      };
    } catch (e) {
      throw e;
    }
  }

  async inviteApproval(user, status, inviteId) {
    try {
      const inviteRes = await inviteRepo.findById(inviteId);
      if (!inviteRes || inviteRes.status != 'accepted') {
        return { status: 404, message: 'Invite not found' };
      }
      if (inviteRes.invitedBy.toString() !== user._id.toString()) {
        return { status: 401, message: 'Unauthorized Invite' };
      }
      if (status) {
        if (user.partner) {
          return { status: 401, message: 'Partner already exists' };
        }
        user.partner = inviteRes.user;
        await user.save();
      }
      inviteRes.status = status ? 'confirmed' : 'declined';
      await inviteRes.save();
      if (status) {
        await inviteRepo.updateMany(
          {
            invitedBy: user._id,
            _id: { $ne: inviteId },
            isActive: true,
          },
          { isActive: false },
        );
        await notificationCont.create(user, {
          title: `Partner Request Confirmed!`,
          message: `You are now partner with ${user.full_name}`,
          user: inviteRes.user.toString(),
          type: 'partner-confirmed',
        });
      }
      return {
        status: 200,
        data: inviteRes,
        message: 'Partner request updated',
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelInvite(user, inviteId) {
    try {
      const inviteRes = await inviteRepo.findOne({
        _id: inviteId,
        status: 'pending',
        isDeleted: false,
        isActive: true,
        invitedBy: user._id,
      });
      if (!inviteRes) {
        return { status: 404, message: 'Invite not found' };
      }
      inviteRes.status = 'cancelled';
      await inviteRes.save();
      let notificationRes;
      if (inviteRes?.user) {
        await notificationCont.deleteNotification(inviteId);
      }
      return {
        status: 200,
        data: { inviteRes, notificationRes },
        message: 'Partner request cancelled',
      };
    } catch (e) {
      throw e;
    }
  }

  async getInvites(user, params) {
    try {
      if (['pending', 'accepted'].indexOf(params.status) === -1) {
        return { status: 400, message: 'Invalid invite status' };
      }
      const filterParams = {
        status: params.status,
        isDeleted: false,
        isActive: true,
      };
      if (params.type === 'sent') {
        filterParams.invitedBy = user._id;
      } else {
        filterParams.user = user._id;
      }
      const invites = await inviteRepo.find(filterParams);
      return {
        status: 200,
        data: invites,
        message: 'Invites fetched successfully',
      };
    } catch (e) {
      throw e;
    }
  }

  async getInvite(id) {
    try {
      const invite = await inviteRepo.findById(id);
      return { status: 200, data: invite, message: 'Invite details' };
    } catch (e) {
      throw e;
    }
  }

  async addInvite(user, code) {
    //Check if invite code is same as user
    if (user.partner_code === code || user.fan_code === code) {
      return { status: 400, message: 'You cannot use your invite code' };
    }
    const getInvitedUser = await userRepo.getByField({
      $or: [{ partner_code: code }, { fan_code: code }],
      isActive: true,
      isDeleted: false,
    });
    if (!getInvitedUser) {
      return { status: 404, message: 'Invite code not found' };
    }
    //Check if invitee has an active subscription
    const subRes = await subController.getSubscriptionStatus(user._id);
    if (subRes && subRes.isSubActive) {
      return { status: 403, message: 'You have an active subscription' };
    }
    //Check if invitor has an active subscription
    const invitorSubRes = await subController.getSubscriptionStatus(
      getInvitedUser._id,
    );
    if (invitorSubRes && !invitorSubRes.isSubActive) {
      return { status: 403, message: 'Invitor is not subscribed' };
    }
    const inviteType = getInvitedUser.partner_code === code ? 'partner' : 'fan';
    //Check if current user is a partner or the invitor has a partner
    const getUserPartner = await userRepo.getByField({ partner: user._id });
    if (inviteType === 'partner') {
      if (getInvitedUser.partner || getUserPartner) {
        return { status: 403, message: 'You cannot be added as a partner' };
      }
    }
    //If already invited by email, phone or link
    const checkInviteExists = await inviteRepo.getByField({
      user: user._id.toString(),
      invitedBy: getInvitedUser._id.toString(),
      isActive: true,
      isDeleted: false,
      status: { $in: ['pending', 'accepted', 'confirmed'] },
    });
    if (checkInviteExists) {
      return { status: 409, message: 'Invite already exits' };
    }
    const inviteRes = await inviteRepo.save({
      name: user.full_name,
      email: user.email,
      referralCode: code,
      user: user._id,
      invitedBy: getInvitedUser._id,
      inviteType: `${inviteType}-invite`,
      invitedVia: 'link',
      status: 'pending',
    });
    const notificationRes = await this.sendNotifications(
      user,
      { inviteType: inviteType },
      inviteRes,
    );
    return {
      status: 200,
      data: { inviteRes, notificationRes },
      message: 'Invite details',
    };
  }

  async partnerRemove(user) {
    try {
      if (!user.partner) {
        return { status: 404, message: "you don't have partner to cancel" };
      }
      const userInvite = await inviteRepo.getByField({
        invitedBy: user._id,
        user: user.partner,
        status: 'confirmed',
        isActive: true,
        isDeleted: false,
        inviteType: 'partner-invite',
      });
      if (!userInvite) {
        return { status: 404, message: 'Partner not found' };
      }
      userInvite.isActive = false;
      userInvite.status = 'removed';
      await userInvite.save();
      const getInvitedUser = await userRepo.getById({ _id: user.partner });
      user.partner = null;
      await user.save();
      const content = {
        title: `${ucFirstLetter(user.full_name)} Removed You`,
        message: `${user.full_name} has removed you as a partner`,
        image: user.profile_pic || configs.DEFAULT_IMG,
      };
      const notificationRes = await notificationCont.create(user, {
        ...content,
        user: getInvitedUser._id,
        type: `partner-removed`,
        invite: userInvite._id,
      });
      this.sendPushNotifications(getInvitedUser, content);

      return {
        status: 200,
        data: { inviteRes: userInvite, notificationRes }, // remember hint
        message: 'Partner removed successfully',
      };
    } catch (error) {
      throw error;
    }
  }
  async getInviteType(inviteId) {
    try {
      const inviteRes = await inviteRepo.findOne({
        _id: inviteId,
        status: 'pending',
        isDeleted: false,
        isActive: true,
      });
      const userCode = await userRepo.getByField({
        $or: [
          { partner_code: inviteRes.referralCode },
          { fan_code: inviteRes.referralCode },
        ],
      });
      const type =
        userCode.partner_code === inviteRes.referralCode ? 'partner' : 'fan';
      return type;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InviteController();
