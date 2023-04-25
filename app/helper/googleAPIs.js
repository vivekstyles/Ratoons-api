const { google } = require('googleapis');
const androidpublisher = google.androidpublisher('v3');
const configs = require('../config');

class GoogleAPIs {
  async verifyPurchase(params) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: configs.GOOGLEPLAY.SERVICE_JSON,
        scopes: [configs.GOOGLEPLAY.PUBLISHER_SCOPE],
      });
      const authClient = await auth.getClient();
      google.options({ auth: authClient, version: 'v3' });
      const res = await androidpublisher.purchases.subscriptionsv2.get(params);
      return res.data;
    } catch (e) {
      console.log('Error', e);
      throw e;
    }
  }
}

module.exports = new GoogleAPIs();
