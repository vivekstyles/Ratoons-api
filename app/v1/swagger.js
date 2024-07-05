const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

// Basic Meta Informations about our API
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Ratoons API', version: '1.0.0' },
  },
  apis: [
    './app/routes/api/user.routes.js',
    './app/routes/api/athlete.router.js',
    './app/routes/api/cms.router.js',
    './app/routes/api/contact.router.js',
    './app/routes/api/faq.router.js',
    './app/routes/api/subscription.router.js',
    './app/routes/api/notifications.router.js',
    './app/routes/api/meta_data.router.js',
    './app/routes/api/invites.router.js',
    './app/routes/api/recruiter.router.js',
    './app/routes/admin/sport.routes.js',
    './app/routes/admin/user.routes.js',
    './app/routes/admin/faq.routes.js',
    './app/routes/admin/cms.routes.js',
    './app/routes/admin/help_and_support.routes.js',
    './app/routes/admin/subscription_plan.routes.js',
    './app/routes/admin/meta_data.routes.js',
  ],
  security: [{ ApiKeyAuth: [] }],
};

// Docs in JSON format
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
const swaggerDocs = (app, port) => {
  // Route-Handler to visit our docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // Make our docs in JSON format available
  app.get('/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log(`Version 1 Docs are available on ${global.BASE_URL}/docs`);
};
module.exports = { swaggerDocs };
