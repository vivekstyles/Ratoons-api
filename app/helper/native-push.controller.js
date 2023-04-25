const path = require('path');
let FCM = require('fcm-push');
let apn = require('apn');
let config = require('../config');
// ================= for ANDROID push Notification ==========================================
let serverKey = config.android_serverKey;
let fcm = new FCM(serverKey);
let notiifcationRepo = require('notification/repositories/notification.repository');
// ================= for ANDROID push Notification ==========================================

// ================= IOS push Notification ==========================================
let options = {
  token: {
    key: config.ios_key,
    keyId: config.ios_keyId,
    teamId: config.ios_teamId,
  },
  production: false,
  // production: true
};

let apnProviderForDriver = new apn.Provider(options);
// ================= IOS push Notification ==========================================

exports.sendPush = async function (notificationPayload, data, extra = {}) {
  // for(let index = 0; index < notificationPayload.length; index++){
  try {
    if (notificationPayload.deviceType.toLowerCase() == 'ios') {
      let note = new apn.Notification();
      note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
      note.badge = 1;
      note.title = data.title;
      note.payload = extra;
      note.body = data.body;
      note.topic = 'com.webskitters.BALMA';
      let result = await apnProviderForDriver.send(
        note,
        notificationPayload.deviceToken,
      );

      if (result.sent.length > 0) {
        extra['success'] = true;
        let saveNotification = await notiifcationRepo.save(extra);
        // return { status: 200, success: true, data: [], message: 'Push Sent' };
      } else {
        extra['success'] = false;
        extra['failureReason'] = '';
        let saveNotification = await notiifcationRepo.save(extra);
        // return { status: 200, success: false, data: [], message: 'Push Sent' };
      }
    } else {
      let message = {
        to: notificationPayload.deviceToken,
        collapse_key: 'new_messages',
        data: extra,
        notification: {
          title: data.title,
          body: data.body,
          click_action: data.clickAction,
        },
      };

      let response = await fcm.send(message);
      let parsedResponse = JSON.parse(response);
      if (parsedResponse.success) {
        extra['success'] = true;
        let saveNotification = await notiifcationRepo.save(extra);
        // return { status: 200, success: true, data: [], message: 'Push Sent' };
      } else {
        extra['success'] = false;
        extra['failureReason'] = '';
        let saveNotification = await notiifcationRepo.save(extra);
        // return { status: 200, success: false, data: [], message: 'Push Sent' };
      }
    }
  } catch (e) {
    console.log(91, e);
  }

  // }
  return { status: 200, data: [], message: 'Push Sent' };
};
