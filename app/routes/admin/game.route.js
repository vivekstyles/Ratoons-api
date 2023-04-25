const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const gameController = require('game/controllers/game.controller');
const multer = require('multer');

const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (req.files[0].fieldname.match('image') != null) {
      callback(null, './public/uploads/game');
    } else {
      callback(null, './public/uploads');
    }
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
  },
});

const uploadFile = multer({
  storage: Storage,
});
const request_param = multer();

//authentication section of game
namedRouter.all('/game*', auth.authenticate);

namedRouter.post('game.getall', '/game/getall', async (req, res) => {
  try {
    const success = await gameController.getAll(req, res);
    res.send({
      meta: success.meta,
      data: success.data,
    });
  } catch (error) {
    res.status(error.status).send(error);
  }
});
// /*@Route:  game  Edit*/
// namedRouter.get("game.edit", '/game/edit/:id', gameController.edit);

// /*@Route:  game  update*/
// namedRouter.post("game.update", '/game/update', uploadFile.any(), gameController.update);

// sport Delete Route
// namedRouter.get("game.delete", "/game/delete/:id", gameController.delete);

//sport Status Change Route
// namedRouter.get("game.statusChange", '/game/status-change/:id', request_param.any(), gameController.statusChange);

//Export the express.Router() instance
module.exports = router;
