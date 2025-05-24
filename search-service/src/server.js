require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dbConnect = require("./utils/db");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const Redis = require("ioredis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const searchRouter = require("./router/searct.route");
const errorHandler = require("./middleware/errorHandler");
const {
  handleCreatePost,
  handlePostSearchDeleted,
} = require("./eventHandlers/search-event-handlers");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3004;
const redisClient = new Redis(process.env.REDIS_URL);
global.redisClient = redisClient;

// global middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging each request
app.use((req, _, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Ddos protection and  rate limit
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "search_middleware",
  points: 10,
  duration: 120,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate Limit exceeded for IP:${req.ip}`);
      res.status(429).json({ message: "Too many requests", success: false });
    });
});

//ip baased rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
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

app.use("/api/search/posts", sensitiveEndpointsLimiter);
app.use(
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRouter
);

app.use(errorHandler);

// mongo db connection
dbConnect()
  .then(() => {
    logger.info("dbconnected successfully");

    app.listen(PORT, async () => {
      logger.info(`search-services runing on port ${PORT}`);
      await connectToRabbitMQ();

      await consumeEvent("post.created", handleCreatePost);
      await consumeEvent("post.delete", handlePostSearchDeleted);
    });
  })
  .catch((err) => {
    logger.warn("db connection error", err);
  });
