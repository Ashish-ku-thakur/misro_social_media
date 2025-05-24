require("dotenv").config(); // सबसे पहले dotenv लोड करें

const mongoose = require("mongoose");
const logger = require("./logger");

const dbConnect = async () => {
  // logger.info("dbConnecting");
  try {
    await mongoose.connect(process.env.MONGO_URI); // `new` मत लगाओ
  } catch (error) {
    logger.error("dbConnecting error", error);
    throw error; // ताकि catch में जा सके server.js में
  }
};

module.exports = dbConnect;
