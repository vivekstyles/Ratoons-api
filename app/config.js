const nodemailer = require('nodemailer');
const path = require('path');
const isProd = process.env.NODE_ENV === 'prod';
console.log(process.env.NODE_ENV);
const configs = {
  HOST: process.env.HOST || 'localhost',
  NODE_ENV: process.env.NODE_ENV || 'local',
  jwtSecret: 'MyS3cr3tK3Y',
  jwtSession: { session: false },
  PAGINATION_PERPAGE: 10,
  android_serverKey:
    'AAAA--U1itk:APA91bHrb92x3pImrnrbEungvULxPJhYLxagXWEs2m-6YpuJacjSrgwqhlTgii-Q-2em6KGfDRdg253cuzy7L7SUqnCNuVwUDY_AQUb707GS1-Pq7HsjDUM-EW5BM6_DsIcZcDdk6hWc',
  ios_key: path.join(__dirname, '/key_file/AuthKey_7XGMBSUZ7H.p8'),
  ios_keyId: '7XGMBSUZ7H',
  ios_teamId: 'H23W3EERLK',
  isProd,
  getPort: process.env.PORT || 1415,
  ASSET_URL: process.env.ASSET_URL || 'https://ssk-asset.s3.amazonaws.com/',
  getAdminFolderName: process.env.ADMIN_FOLDER_NAME || 'admin',
  getApiFolderName: process.env.API_FOLDER_NAME || 'api',
  getFrontFolderName: process.env.FRONT_FOLDER_NAME || 'front',
  nonSecurePaths: [
    '/vehicleOwner/reset-password',
    '/vehicleOwner/login',
    '/vehicleOwner/store',
    '/vehicleOwner/verify',
    '/vehicleOwner/resendOtp',
  ],
  // transporter: nodemailer.createTransport({
  //     service: 'gmail',
  //     auth: {
  //         user: process.env.MAIL_USERNAME,
  //         pass: process.env.MAIL_PASSWORD,
  //     }
  // }),
  ORDER_RECEIVE_MAIL: 'test@yopmail.com, ron@yopmail.com',
  FIREBASE_APIKEY: process.env.FIREBASE_APIKEY,
  FIREBASE_AUTHDOMAIN: process.env.FIREBASE_AUTHDOMAIN,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
  FIREBASE_PROJECTID: process.env.FIREBASE_PROJECTID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSEGING_SENDERID: process.env.FIREBASE_MESSEGING_SENDERID,
  // aws.config.update({
  //     accessKeyId: config.AWS_ACCESS_KEY,
  //     secretAccessKey:  config.AWS_SECRET_KEY,
  // });
  SSK_WEB_URL:
    process.env.SSK_WEB_URL || `https://api.dev.socialscorekeeper.com/api/`,
  SSK_MAIL_ADDRESS:
    process.env.SSK_MAIL_ADDRESS || 'no-reply@socialscorekeeper.com',
  GOOGLEPLAY: {
    SERVICE_JSON: JSON.parse(
      Buffer.from(process.env.GOOGLEPLAY_SERVICE_JSON, 'base64').toString(),
    ),
    PUBLISHER_SCOPE: process.env.GOOGLEPLAY_PUBLISHER_SCOPE,
  },
  APPSTORE: {
    PEM_KEY: Buffer.from(process.env.APPSTORE_PEM_KEY, 'base64').toString(),
    SHARED_KEY: process.env.APPSTORE_SHARED_KEY,
    ISSUER_ID: process.env.APPSTORE_ISSUER_ID,
    API_KEY_ID: process.env.APPSTORE_API_KEY_ID,
    BUNDLE_ID: process.env.APPSTORE_BUNDLE_ID,
    verifyReceiptUrl: process.env.APPSTORE_VERIFY_RECEIPT_URL,
    subscriptionUrl: process.env.APPSTORE_SUBSCRIPTION_URL,
  },
  VERIFY_PASS_KEY: process.env.VERIFY_PASS_KEY,
  VERIFY_PASS_VALUE: process.env.VERIFY_PASS_VALUE,
  EMAIL_HEADER_IMG: '',
  FCM_CONFIG: JSON.parse(
    Buffer.from(process.env.FCM_CONFIG, 'base64').toString(),
  ),
  DEFAULT_IMG:
    process.env.DEFAULT_IMG ||
    'https://ssk-asset.s3.amazonaws.com/dev/account.png',
};
configs.EMAIL_HEADER_IMG = `${configs.ASSET_URL}static/header.png`;
module.exports = configs;
