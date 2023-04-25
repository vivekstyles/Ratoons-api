const axios = require('axios').default;
const fs = require('fs');
const jwt = require('jsonwebtoken');
const configs = require('../config');
class AppStore {
  async verifyAppStoreReceipt(transactionReceipt) {
    try {
      const receipt = await axios.post(configs.APPSTORE.verifyReceiptUrl, {
        'receipt-data': transactionReceipt,
        password: configs.APPSTORE.SHARED_KEY,
        'exclude-old-transactions': false,
      });
      // console.log('verifyAppStoreReceipt', receipt.data.receipt);
      return receipt.data.receipt;
    } catch (e) {
      console.log('Error in verifyAppStoreReceipt', e);
      throw e;
    }
  }

  async generateToken() {
    const now = Math.round(new Date().getTime() / 1000);
    let payload = {
      iss: configs.APPSTORE.ISSUER_ID,
      iat: now,
      exp: now + 1199, //expire in 20mins
      aud: 'appstoreconnect-v1',
      bid: configs.APPSTORE.BUNDLE_ID,
    };
    let signOptions = {
      algorithm: 'ES256', // you must use this algorithm, not jsonwebtoken's default
      header: {
        alg: 'ES256',
        kid: configs.APPSTORE.API_KEY_ID,
        typ: 'JWT',
      },
    };
    const token = jwt.sign(payload, configs.APPSTORE.PEM_KEY, signOptions);
    // console.log('JWT token: ', token);
    return token;
  }

  async verifySubscription(transactionId) {
    try {
      const tokenStr = await this.generateToken();
      const header = { Authorization: `Bearer ${tokenStr}` };
      const response = await axios.get(
        `${configs.APPSTORE.subscriptionUrl}${transactionId}`,
        { headers: header },
      );
      if (!response.data.data[0]) {
        return false;
      }
      const signedTrans =
        response.data.data[0]?.lastTransactions[0]?.signedTransactionInfo;
      const payloadString = signedTrans?.split('.')[1];
      const payload = JSON.parse(
        Buffer.from(payloadString, 'base64').toString(),
      );
      // console.log('Payload', payload);
      return payload;
    } catch (e) {
      console.log('Error in verifySubscription', e);
      throw e;
    }
  }
}
module.exports = new AppStore();
