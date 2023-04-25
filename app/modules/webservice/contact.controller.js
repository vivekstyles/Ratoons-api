const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
const contactRepo = require('contact/repositories/contact.repository');

class contactController {
  constructor() {}

  async support(req, res) {
    try {
      req.body.name = req.user.full_name;
      req.body.email = req.user.email;

      await contactRepo.save(req.body);
      return {
        status: 200,
        data: {},
        message:
          'Your request has been submitted. Someone from our team will contact you shortly.',
      };
    } catch (error) {
      console.log(error);
      res.status(500).send({ status: 500, message: error.message });
    }
  }
}

module.exports = new contactController();
