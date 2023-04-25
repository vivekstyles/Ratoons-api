const admin = require('firebase-admin');
const configs = require('../config');
admin.initializeApp({
  credential: admin.credential.cert(configs.FCM_CONFIG),
});

const sendNotifications = async (data, tokens) => {
  //Remove empty tokens from list
  if (tokens.indexOf('') > -1) {
    tokens.splice(tokens.indexOf(''), 1);
  }
  if (!tokens.length) {
    return;
  }
  // Send a message to devices with the registered tokens
  const response = await admin.messaging().sendMulticast({
    tokens: tokens, // member's fcm tokens
    data: data,
    notification: {
      title: data.title,
      body: data.message,
      imageUrl: data?.image,
    },
    android: { notification: { sound: 'default' } },
    apns: {
      //set props when app is in background mode
      payload: {
        aps: {
          sound: 'default', // to set default sound
          'content-available': 1, // to show badge count
        },
      },
    },
  });
  console.log('FCM response', JSON.stringify(response));
};
module.exports = sendNotifications;
