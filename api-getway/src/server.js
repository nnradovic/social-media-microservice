require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const logger = require("..//utils/logger");
const proxy = require("express-http-proxy");
const errorHandler = require("../middleware/errorHandler");

const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("error", (err) => {
  console.error("Redis error: %o", err);
});

const rateLimitOptions = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Sensitive route rate limit exceeded for IP: %s", req.ip);
    res.status(429).json({ error: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
app.use(rateLimitOptions);
app.use((req, res, next) => {
  logger.info("%s %s", req.method, req.url);
  logger.debug("Request body: %o", req.body);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res) => {
    logger.error("Proxy error: %o", err);
    res.status(500).json({ error: "Internal Server Error" });
  },
};

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      if (proxyRes.statusCode >= 400) {
        logger.info(
          "Upstream service error: %s %s returned status %d",
          userReq.method,
          userReq.url,
          proxyRes.statusCode,
        );
      }
      return proxyResData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info("Identity service URL: %s", process.env.IDENTITY_SERVICE_URL);
  logger.info(`Redis URL: %s`, process.env.REDIS_URL);
});

app.use(helmet());
app.use(cors());
app.use(express.json());
