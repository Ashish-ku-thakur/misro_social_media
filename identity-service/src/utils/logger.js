const winston = require("winston");

const { combine, timestamp, json,  } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
   
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
  ),
  defaultMeta: { service: "identity-service" },
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),

    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: combine(timestamp(), json()),
    }),
    new winston.transports.File({
      filename: "info.log",
      //   level: "info",
      format: combine(timestamp(), json()),
    }),
  ],
});

module.exports = logger;
