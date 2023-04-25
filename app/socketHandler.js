const execSync = require('child_process').execSync;
const jwt = require('jsonwebtoken');
const configs = require('./config');
// const invite = require('../app/modules/invites/controllers/invites.controller');
const notification = require('../app/modules/notifications/controllers/notifications.controller');
const userRepo = require('./modules/user/repositories/user.repository');
const deviceRepo = require('./modules/device_info/repositories/device_info.repository');
const fcm = require('./helper/firebase');
const taskId = execSync(
  'curl -s "$ECS_CONTAINER_METADATA_URI_V4/task" \
  | jq -r ".TaskARN" \
  | cut -d "/" -f 3',
  (error, stdout, stderr) => {
    if (error) {
      console.log(`task id error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(` task id stderr: ${stderr}`);
      return;
    }
    console.log(`task id stdout: ${stdout}`);
    return stdout;
  },
);
const socketHandler = async (io, socket) => {
  //Validate user token on connection
  try {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.token;
    const payload = jwt.verify(token, configs.jwtSecret);
    const user = await userRepo.getById(payload.id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.populate({ path: 'role', select: 'title role' });
    const userId = `user_${user._id.toString()}`;
    socket.user = user;
    zz;
    socketConn.set(userId, socket);
    console.log(
      `Socket connected to Task - ${taskId?.toString()}. ${socket.user._id.toString()} ${
        socket.user.email
      }`,
    );
    socket.join(userId);
  } catch (e) {
    console.log('Error in socket connection', e);
    socket.disconnect();
  }

  //Send an invite to user
  //{  "type": "email",  "inviteType": "partner",  "email": "socket2@yopmail.com"}
  socket.on('invite-user', async (params) => {
    try {
      const response = await invite.sendInvite(socket.user, params);
      if (!response.data) {
        socket.emit('invite-user', response);
        return false;
      }
      const { inviteRes, notificationRes } = response.data;
      const userId = inviteRes?.user ? `user_${inviteRes.user.toString()}` : '';
      result = inviteRes;
      //Emit to partner
      if (userId && socketConn.has(userId)) {
        io.to(userId).emit('invite-requested', notificationRes);
      }
      //Emit response to user
      socket.emit('invite-user', response);
    } catch (e) {
      console.log(`SocketEvent => invite-user, ${socket.user._id}, ${e}`);
      throw e;
    }
  });

  //Create invite for user who comes with referal code
  //{"code": "dsfsdfgsdg"}
  socket.on('invite-add', async (params) => {
    try {
      const data = await invite.addInvite(socket.user, params.code);
      if (!data.data) {
        socket.emit('invite-add', data);
        return false;
      }
      const { notificationRes } = data.data;
      //Emit response to user
      socket.emit('invite-requested', notificationRes);
    } catch (e) {
      console.log(`SocketEvent => invite-add, ${socket.user._id}, ${e}`);
      throw e;
    }
  });

  //Cancel an invite sent by user
  //{"inviteId": "6399b381ccb6cecaaaf41255"}
  socket.on('cancel-invite', async (params) => {
    try {
      const response = await invite.cancelInvite(socket.user, params.inviteId);
      if (!response.data) {
        socket.emit('cancel-invite', response);
        return false;
      }
      const { inviteRes, notificationRes } = response.data;
      const partnerId = inviteRes?.user
        ? `user_${inviteRes.user.toString()}`
        : '';
      if (partnerId && socketConn.has(partnerId)) {
        io.to(partnerId).emit('invite-cancelled', notificationRes);
      }
      //Emit response to user
      socket.emit('cancel-invite', response);
    } catch (e) {
      console.log(`SocketEvent => cancel-invite, ${socket.user._id}, ${e}`);
      throw e;
    }
  });

  //Accept or reject an invite
  //{"status": false||true,"inviteId": "6399b381ccb6cecaaaf41255"}
  socket.on('update-invite', async (params) => {
    try {
      const data = await invite.respondToPartnerInvite(
        socket.user,
        params.status,
        params.inviteId,
      );
      if (!data.data) {
        socket.emit('update-invite', data);
        return false;
      }
      const { inviteRes, notifyRes } = data.data;
      const userId = inviteRes.invitedBy.toString();
      //Emit to partner
      io.to(`user_${userId}`).emit(`invite-${inviteRes?.status}`, notifyRes);
      //Emit response to user
      socket.emit('update-invite', data);
    } catch (e) {
      console.log(`SocketEvent => update-invite, ${socket.user._id}, ${e}`);
      throw e;
    }
  });

  // Remove partner for scorekeeper
  // {}
  socket.on('remove-partner', async (params) => {
    try {
      const data = await invite.partnerRemove(socket.user);
      if (!data.data) {
        socket.emit('remove-partner', data);
        return false;
      }
      const { inviteRes, notificationRes } = data.data;
      const userId = inviteRes.user.toString();
      //Emit to partner
      io.to(`user_${userId}`).emit(`partner-removed`, notificationRes);
      //Emit response to user
      socket.emit('remove-partner', data);
    } catch (e) {
      console.log(`SocketEvent => remove-partner, ${socket.user._id}, ${e}`);
      throw e;
    }
  });

  //Notification Fetch
  //{ lastId: "", limit:10 }
  socket.on('notification-list', async (params) => {
    try {
      const response = await notification.getUnreadUserNotifications(
        socket.user._id.toString(),
        params,
      );
      socket.emit('notification-list', response);
    } catch (e) {
      console.log(`SocketEvent => notification-list, ${socket.user._id}, ${e}`);
      throw e; 
    }
  });

  // pending invite notification Fetch
  //{ page: 1, limit:10 }
  socket.on('invite-notifications', async (callbackFun) => {
    try {
      const response = await notification.getPendingInviteNotifications(
        socket.user._id.toString(),
        'partner-requested',
      );
      return callbackFun(response);
    } catch (e) {
      console.log(`SocketEvent => notification-list, ${socket.user._id}, ${e}`);
      throw e;
    }
  });

  //Notification Count
  socket.on('notification-count', async () => {
    const userId = socket.user?._id;
    let user;
    if (userId) {
      user = await userRepo.getById(userId, 'notificationCount');
    }
    socket.emit('notification-count', user?.notificationCount);
  });

  //clear single or all notifications
  //{inviteId: 'clearAll|<invite-id>', lastId: <id>}
  socket.on('clear-notification', async (params) => {
    try {
      let response;
      if (params.inviteId === 'clearAll') {
        response = await notification.clearAllUserNotifications(
          socket.user,
          params.lastId,
        );
        socket.emit('clear-notification', {
          ...response,
          params: params,
        });
        socket.emit('notification-list', response);
      } else {
        response = await notification.markAsRead(socket.user, params.inviteId);
        socket.emit('clear-notification', {
          ...response,
          params: params,
        });
      }
    } catch (e) {
      console.log(
        `SocketEvent => clear-notification, ${socket.user._id}, ${e}`,
      );
      throw e;
    }
  });

  //clear notification count
  socket.on('clear-notification-count', async () => {
    try {
      const response = await notification.clearUserNotificationsCount(
        socket.user,
      );
      socket.emit('clear-notification-count', response);
    } catch (e) {
      console.log(
        `SocketEvent => clear-notification-count, ${socket.user._id}, ${e}`,
      );
      throw e;
    }
  });

  //On user disconnection
  socket.on('disconnect', function () {
    const userId = socket.user._id.toString();
    socketConn.delete(`user_${userId}`);
    socket.leave(`user_${userId}`);
    // io.to(roomId).emit('disconnected', { user: user, message: 'Disconnected' });
    console.log(
      `Socket disconnected from Task - ${taskId?.toString()}. ${userId} ${
        socket.user?.email
      }`,
    );
  });

  socket.on('error', function (e) {
    console.log(`SocketEvent => error, ${socket.user._id}, ${e}`);
  });
};
module.exports = socketHandler;
