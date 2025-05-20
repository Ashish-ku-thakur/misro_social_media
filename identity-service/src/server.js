const express = require("express");
const dbConnect = require("./utils/db");
const logger = require("./utils/logger");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const userRouter = require("./router/identity-service");
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 3001;
const app = express();

const redisClient = new Redis(process.env.REDIS_URL);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// log each request
app.use((req, _, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Ddos protection and  rate limit
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 60,
});

app.use((req, res, next) => {
  rateLimiter.consume(req.ip).then(() => next())
    .catch(() => {
      logger.warn(`Rate Limit exceeded for IP:${req.ip}`);
      res.status(429).json({ message: "Too many requests", success: false });
    });
});

//ip baased rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
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

//apply this sensitiveEndpointsLimiter to our routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", userRouter);

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
      logger.info(`Idenity-services runing on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.warn("db connection error", err);
  });
