// core modules
const { join, resolve } = require('path');
const http = require('http');
const { promisify } = require('util');
const { stat, readdir } = require('fs');
const fs = require('fs');
// 3rd party modules
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const engine = require('ejs-locals');
const flash = require('connect-flash');
const routeLabel = require('route-label');
var nodemailer = require('nodemailer');
const path = require('path');
const { Server } = require('socket.io');
// Import module in global scope
require('app-module-path').addPath(__dirname + '/app/modules');
_ = require('underscore');
require('dotenv').config();
const { swaggerDocs: V1SwaggerDocs } = require(join(
  __dirname,
  'app/v1/swagger.js',
));

//Yes, TLS is required
// const serverConfig = {
//   key: fs.readFileSync('privkey.pem'),
//   cert: fs.readFileSync('cert.pem'),
// };

config = require(resolve(join(__dirname, 'app', 'config')));
auth = require(resolve(join(__dirname, 'app', 'auth')))();
utils = require(resolve(join(__dirname, 'app', 'utils')));

const app = express();
const namedRouter = routeLabel(app);

app.get('/', (req, res) => {
  res.send('Ratoons API');
});
app.use(express.static(resolve(join(__dirname, 'public'))));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  const requestId = Math.random();
  console.log('requestId', requestId, Date.now());
  console.log('req.url', req.method, req.url);
  console.log('req.ip', req.ip);
  next();
  res.on('finish', () => {
    console.log('Requestcompleted', requestId, Date.now());
  });
});

app.use('/public', express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
/***********Socket Connection***********/
socketConn = new Map();
io = new Server(server);
//Import mongo adapter
const mongoAdapter = require('./app/mongoAdapter');
(async () => {
  console.log('Connecting to mongo adapter');
  await mongoAdapter(io);
})();
const socketHandler = require('./app/socketHandler');
//Register socket handlers
const socketConnection = (socket) => {
  socketHandler(io, socket);
};
io.on('connection', socketConnection);
/***********Socket Connection***********/

/******************** Firebase Initialize*******************/
firebase = require('firebase');
require('firebase/auth');
require('firebase/database');

firebase_app = firebase.initializeApp({
  apiKey: config.FIREBASE_APIKEY,
  authDomain: config.FIREBASE_AUTHDOMAIN,
  databaseURL: config.FIREBASE_DATABASE_URL,
  projectId: config.FIREBASE_PROJECTID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSEGING_SENDERID,
});
/**********************End***************************/

// express locals instance
app.locals.moment = require('moment');

/*****************************************************/
/********* Functions + variable declaration *********/
/***************************************************/

const isProd = config.isProd;
const getPort = config.getPort;
const getAdminFolderName = config.getAdminFolderName;
const getApiFolderName = config.getApiFolderName;
global.BASE_URL = isProd
  ? `http://${process.env.HOST}`
  : `http://${process.env.HOST}:${getPort}`;

async function isDirectory(f) {
  return (await promisify(stat)(f)).isDirectory();
}
async function _readdir(filePath) {
  const files = await Promise.all(
    (
      await promisify(readdir)(filePath)
    ).map(async (f) => {
      const fullPath = join(filePath, f);
      return (await isDirectory(fullPath)) ? _readdir(fullPath) : fullPath;
    }),
  );

  return _.flatten(files);
}

async function readDirectory(path) {
  readdir(path, function (err, items) {});
}

/***************  Schedule Cron Job Starts Here ***************/
//Import Cron Jobs
var CronJob = require('node-cron');

CronJob.schedule('*/2 * * * *', () => {
  //Change booking status to Failed if no one attended
  require('./app/modules/webservice/booking.controller').updateStatusOfFailedBooking();
});

CronJob.schedule('*/5 * * * *', () => {
  //Sending pending push,toaster,email notification
  require('./app/modules/webservice/cronjob.controller').sendPendingNotificationToUsers();
});

CronJob.schedule('50 23 * * *', () => {
  //Removes removeable files from server
  require('./app/modules/webservice/cronjob.controller').deleteRemovableFiles();
});

CronJob.schedule('0 2 * * *', () => {
  //Subscription renew
  require('./app/modules/webservice/cronjob.controller').subscriptionRenew();
});

CronJob.schedule('10 1 * * *', () => {
  //Removes temp post files from server if any
  require('./app/modules/webservice/cronjob.controller').deleteTempPostFiles();
});

/***************  Mail Configuration ***************/
//transporter = config.transporter;

transporter = nodemailer.createTransport({
  host: process.env.MAIL_SMTP_SERVER,
  secureConnection: true,
  port: process.env.MAIL_SMTP_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

/***************  AWS Configuration ***************/
s3 = config.s3;

/******************** Middleware registrations *******************/
app.use(cors());
app.use(cookieParser()); // read cookies (needed for auth)
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000,
  }),
); // get information from html forms
app.use(
  bodyParser.json({
    limit: '50mb',
  }),
);
app.use(flash());
app.use(
  session({
    secret: 'delivery@&beverage@#',
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(express.static('./public'));
app.set('views', [
  join(__dirname, './app/views'),
  join(__dirname, './app/modules'),
]);
app.engine('ejs', engine);
app.set('view engine', 'ejs'); // set up ejs for templating

app.use((req, res, next) => {
  // backbutton prevent
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  // Inclide main view path
  res.locals.messages = req.flash();
  auth = require(resolve(join(__dirname, 'app', 'auth')))(req, res, next);
  app.use(auth.initialize());
  // This is for webservice end
  if (req.headers['x-access-token'] != null) {
    req.headers['token'] = req.headers['x-access-token'];
  }
  next();
});
app.get('/healthy', (req, res) => {
  res.send('Healthy');
});
/**
 * Event listener for HTTP server "error" event.
 */
const onError = (error) => {
  const port = getPort;
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(0);
      break;
    default:
      throw error;
  }
};

// Create a server for handling websocket calls
//  wss = new WebSocketServer({server: server});
// console.log("WebSocket Secure server is up and running.");

// wss.on('connection', function connection(ws) {
//     console.log("A new WebSocket client was connected.");
//     ws.on('message', function incoming(data) {
//       console.log("Broadcasting message to all " + wss.clients + " WebSocket clients.");
//       wss.clients.forEach(function each(client) {
//         console.log('Client.ID: ' + client);
//         if (client !== ws && client.readyState === WebSocket.OPEN) {
//             console.log('SEND Client.ID: ' + client);
//             client.send(data);
//         }
//       });
//     });
//   });

/** successful connection */
// wss.on('connection', function (client) {
//    console.log("A new WebSocket client was connected.");
//    /** incomming message */
//    client.on('message', function (message) {
//      /** broadcast message to all clients */
//      wss.broadcast(message, client);
//    });
//  });

// broadcasting the message to all WebSocket clients.
// wss.broadcast = function (data, exclude) {
//    var i = 0, n = this.clients ? this.clients.length : 0, client = null;
//    if (n < 1) return;
//    console.log("Broadcasting message to all " + n + " WebSocket clients.");
//    for (; i < n; i++) {
//      client = this.clients[i];
//      // don't send the message to the sender...
//      if (client === exclude) continue;
//      if (client.readyState === client.OPEN) client.send(data);
//      else console.error('Error: the client state is ' + client.readyState);
//    }
//  };

//  function sendTo(connection, message) {
//     connection.send(JSON.stringify(message));
//   }

(async () => {
  try {
    await require(resolve(join(__dirname, 'app', 'database')))();
    /******************* Routes (Api + Admin) ************/
    const apiFiles = await _readdir(`./app/routes/${getApiFolderName}`);
    apiFiles.forEach((file) => {
      if (!file && file[0] == '.') return;
      namedRouter.use(
        '',
        `/${getApiFolderName}`,
        require(join(__dirname, file)),
      );
    });

    // vivek commended admin start
    // const adminFiles = await _readdir(`./app/routes/${getAdminFolderName}`);
    // adminFiles.forEach((file) => {
    //   if (!file && file[0] == '.') return;
    //   namedRouter.use(
    //     '',
    //     `/${getAdminFolderName}`,
    //     require(join(__dirname, file)),
    //   );
    // });
    // vivek commended admin end

    /******************* Routes (Frontend) ************
        const apiFiles = await _readdir(`./app/routes/${getFrontFolderName}`);
        apiFiles.forEach(file => {

            if (!file && file[0] == '.') return;
            namedRouter.use('', `/${getFrontFolderName}`, require(join(__dirname, file)));
        });
        /*********************************************/
    namedRouter.buildRouteTable();
    if (!isProd && process.env.SHOW_NAMED_ROUTES === 'true') {
      routeList = namedRouter.getRouteTable();
    }
    // vivek commanded starts
    // const generalSettingRepo = require('./app/modules/generalSetting/repositories/generalSetting.repository');

    // let general = await generalSettingRepo.getByField({
    //   isDeleted: false,
    //   status: 'Active',
    // });

    // global.site_name = general.site_title;
    // vivek commanded ends
    global.site_name = 'ratoons';
  
    // console.log(global.site_name.site_title);
    /******************* Service Launch *****************/
    //Set up swagger
    if (config.NODE_ENV !== 'production') {
      V1SwaggerDocs(app, getPort);
    }
    server.listen(getPort);
    server.on('error', onError);
    console.log(
      `Social Score Keeper is running on ${
        global.BASE_URL && global.BASE_URL !== ''
          ? global.BASE_URL
          : `http://${process.env.HOST}:${getPort}`
      }`,
    );
  } catch (error) {
    console.error(error);
  }
})();

module.exports = app;
