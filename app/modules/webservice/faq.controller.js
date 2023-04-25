const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
const faqRepo = require('faq/repositories/faq.repository');

class faqController {
  constructor() {
    this.faq = [];
  }

  async list(req, res) {
    try {
      const faqData = await faqRepo.getAllByField({
        isDeleted: false,
        status: 'Active',
      });
      if (!_.isEmpty(faqData)) {
        return {
          status: 200,
          data: faqData,
          message: 'faq data fetched successfully.',
        };
      } else {
        return { status: 200, data: faqData, message: 'faq Not Available.' };
      }
    } catch (error) {
      res.status(500).send({ status: 500, message: error.message });
    }
  }
}

module.exports = new faqController();
