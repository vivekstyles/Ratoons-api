const notificationRepo = require('../repositories/notifications.repository');
const userRepo = require('../../user/repositories/user.repository');
class Notification {
  async getUnreadUserNotifications(user_id, params) {
    try {
      const filterParams = {
        user: user_id,
        isRead: false,
        isDeleted: false,
        ...(params.lastId && { _id: { $lt: params.lastId } }),
      };
      const notifications = await notificationRepo.getAll(
        filterParams,
        params.limit ? Number(params.limit) : 10,
      );
      return {
        status: 200,
        data: notifications,
        count: notifications.length || 0,
        message: 'User notifications fetched',
      };
    } catch (e) {
      throw e;
    }
  }

  async getPendingInviteNotifications(user_id, params) {
    try {
      const filterParams = {
        user: user_id,
        isRead: false,
        isDeleted: false,
        type: params,
      };
      const notifications = await notificationRepo.getAll(filterParams);
      return {
        status: 200,
        data: notifications,
        message: 'User notifications fetched',
      };
    } catch (e) {
      throw e;
    }
  }

  async markAsRead(user, id) {
    try {
      const notification = await notificationRepo.findOne({
        _id: id,
        isRead: false,
      });
      if (!notification) {
        return { status: 404, message: 'Notification not found' };
      }
      if (notification.user.toString() !== user._id.toString()) {
        return { status: 400, message: 'Unauthorised user' };
      }
      notification.isRead = true;
      await notification.save();
      if (user.notificationCount > 0) {
        user.notificationCount = user.notificationCount - 1;
        await user.save();
      }
      return {
        status: 200,
        data: notification,
        message: 'Notification marked as read',
      };
    } catch (e) {
      throw e;
    }
  }

  async markAsReadByInviteId(user, inviteId) {
    try {
      const notification = await notificationRepo.findOne({
        invite: inviteId,
        isRead: false,
      });
      if (!notification) {
        return { status: 404, message: 'Notification not found' };
      }
      if (notification.user.toString() !== user._id.toString()) {
        return { status: 400, message: 'Unauthorised user' };
      }
      notification.isRead = true;
      await notification.save();
      if (user.notificationCount > 0) {
        user.notificationCount = user.notificationCount - 1;
        await user.save();
      }
      return {
        status: 200,
        data: notification,
        message: 'Notification marked as read',
      };
    } catch (e) {
      throw e;
    }
  }

  async clearUserNotificationsCount(user) {
    try {
      user.notificationCount = 0;
      await user.save();
      return {
        status: 200,
        message: 'Cleared user notification count',
      };
    } catch (e) {
      throw e;
    }
  }

  async create(sentUser, params) {
    try {
      params.sentBy = sentUser._id;
      const response = await notificationRepo.save(params);
      const user = await userRepo.getById(response.user);
      user.notificationCount = user.notificationCount + 1;
      await user.save();
      return { status: 200, data: response, message: 'Notification created' };
    } catch (e) {
      throw e;
    }
  }

  async createOnRegister(user, params) {
    try {
      const response = await notificationRepo.save(params);
      user.notificationCount = user.notificationCount + 1;
      await user.save();
      return { status: 200, data: response, message: 'Notification created' };
    } catch (e) {
      throw e;
    }
  }

  async deleteNotification(inviteId) {
    try {
      const notification = await notificationRepo.findOne({
        invite: inviteId,
        isRead: false,
      });
      if (!notification) {
        return { status: 404, message: 'Notification not found' };
      }
      notification.isDeleted = true;
      await notification.save();
      //Reduce notificaiton count
      const user = await userRepo.getById(notification.user);
      user.notificationCount = user.notificationCount - 1;
      await user.save();
      return { status: 200, message: 'Notification removed' };
    } catch (e) {
      throw e;
    }
  }

  async clearAllUserNotifications(user, lastId = '') {
    try {
      const params = {
        user: user._id,
        type: { $nin: ['partner-requested', 'fan-requested'] },
        ...(lastId && { _id: { $gte: lastId } }),
      };
      await notificationRepo.updateMany(params, { $set: { isRead: true } });
      const notifications = await this.getUnreadUserNotifications(user._id, {});
      return {
        status: 200,
        data: notifications.data,
        count: notifications.count || 0,
        message: 'Cleared user notifications',
      };
    } catch (e) {
      throw e;
    }
  }

  async markInviteNotificationsAsRead(userId) {
    try {
      const data = await notificationRepo.updateMany(
        {
          user: userId,
          status: 'pending',
          type: 'partner-requested',
        },
        { $set: { isRead: true } },
      );
      return data;
    } catch (e) {
      throw e;
    }
  }
}
module.exports = new Notification();
