const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const multer = require('multer');
const sportController = require('../../modules/sport/controllers/sport.controller');
const sportCont = require('../../modules/webservice/sport.controller');
const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/sport');
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
  },
});
const uploadFile = multer({
  storage: Storage,
});
const request_param = multer();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *      type: apiKey
 *      in: header
 *      name: x-access-token
 *   schemas:
 *     SportPostDTO:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Sport title
 *         image:
 *           type: file
 *           format: binary
 *           description: Sport icon
 *         positions:
 *           type: array
 *           description: Athlete positions for the sport
 *         status:
 *           type: string
 *           description: Active|Inactive
 *       example:
 *         title: sport_name
 *         image: <image>
 *         positions: [Pitcher, Catcher]
 *         status: Active
 */

//Authenticate Routes
namedRouter.all('/sport*', auth.authenticateAdminAPI);

// Get All sports
namedRouter.post('sport.getall', '/sport/getall', async (req, res) => {
  try {
    const success = await sportController.getAll(req, res);

    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});

namedRouter.post(
  'sport.insert',
  '/sport/insert',
  uploadFile.any(),
  sportController.insert,
);

// sport Edit Route
namedRouter.get(
  'sport.edit',
  '/sport/edit/:id',
  request_param.any(),
  sportController.edit,
);

/**
 * @swagger
 * /sport/{sport_id}:
 *   put:
 *     security:
 *      - ApiKeyAuth: []
 *     tags:
 *       - Admin Sport
 *     summary: Update sports details
 *     parameters:
 *       - in : path
 *         name: sport_id
 *         description: get sport id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *        multipart/form-data:
 *          schema:
 *            $ref: '#/components/schemas/SportPostDTO'
 *     responses:
 *       200:
 *         description: Athlete Data Added Successfully.
 */
namedRouter.put(
  'sport.update',
  '/sport/:sport_id',
  request_param.fields([{ name: 'image' }]),
  async (req, res) => {
    try {
      const response = await sportCont.updateSport(req, res);
      res.status(response.status).send(response);
    } catch (e) {
      res.status(500).send({ status: 500, message: e.message });
    }
  },
);

// sport Delete Route
namedRouter.get('sport.delete', '/sport/delete/:id', sportController.delete);

//sport Status Change Route
namedRouter.get(
  'sport.statusChange',
  '/sport/status-change/:id',
  request_param.any(),
  sportController.statusChange,
);

// Export the express.Router() instance
module.exports = router;
