require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const proxy = require("express-http-proxy");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { validateToken } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Redis client setup
const redisClient = new Redis(process.env.REDIS_URL);

// Redis error logging
redisClient.on("error", (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP-based rate limiting for sensitive endpoints (e.g. /v1/auth)
const rateLimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Max 50 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ message: "Too many requests", success: false });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
app.use(rateLimitOptions);

// Logging each request
app.use((req, _, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
  // Original path: /api/posts => Converted to /vi/posts
  proxyReqPathResolver: (req) => req.originalUrl.replace("/v1", "/api"),

  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy Error: ${err.message}`);
    res.status(500).json({ message: "Proxy failed", error: err.message });
  },
};

//this proxy is for identity-service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["name"] = "ashish";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response recevied from Identity service:${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// this proxy is for post-service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId; // srcReq = req
      // console.log("srcReq->", srcReq);

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(`Response recevied from post service:${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Check if it's multipart (file upload)
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "application/json"; // forward original content type
      } 

      // Add your own custom headers
      if (srcReq.user && srcReq.user.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      }

      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(`Response recevied from post service:${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

// Global error handler
app.use(errorHandler);

// Server start
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Identity Service URL: ${process.env.IDENTITY_SERVICE_URL}`);
  logger.info(`Post Service URL: ${process.env.POST_SERVICE_URL}`);
  logger.info(`Post Service URL: ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});
