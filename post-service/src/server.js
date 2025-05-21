require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const postRouter = require("./router/post.route");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const dbConnect = require("./utils/db");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const app = express();
const PORT = process.env.PORT || 3002;

const redisClient = new Redis(process.env.REDIS_URL);

// global middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// log each request
app.use((req, _, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

//ip baased rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limite exceeded for ip:${req.ip}`);
    res.status(429).json({ message: "Too many requests", success: false });
  },

  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/post/create-post", sensitiveEndpointsLimiter);

// router
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRouter
);

//error handler
app.use(errorHandler);

// unhandled promise register
process.on("unhandledRejection", (reason, promise) => {
  logger.error("UnhandledRejection at", promise, "reason", reason);
});

// mongo db connection
dbConnect()
  .then(() => {
    logger.info("dbconnected successfully");

    app.listen(PORT, () => {
      logger.info(`post-services runing on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.warn("db connection error", err);
  });
