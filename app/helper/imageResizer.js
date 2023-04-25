const Sharp = require('sharp');

const resizeImg = async (Body, ContentType, width) => {
  let sharp1 = Sharp(Body);
  sharp1 = sharp1.resize(width);
  return sharp1.toFormat(ContentType).toBuffer();
};

module.exports = resizeImg;
