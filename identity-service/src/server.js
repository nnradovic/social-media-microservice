require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identitiy-routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.DNS_SERVERS) {
  dns.setServers(
    process.env.DNS_SERVERS.split(",").map((server) => server.trim()),
  );
}

mongoose
  .connect(process.env.MONGODB_URL, {})
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("Error connecting to MongoDB: %o", err);
  });

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("error", (err) => {
  logger.error("Redis error: %o", err);
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info("%s %s", req.method, req.url);
  logger.debug("Request body: %o", req.body);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1, // 10 requests per second
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((err) => {
      logger.warn("Rate limit exceeded for IP: %s", req.ip);
      res.status(429).json({ error: "Too many requests" });
    });
});

const sensitiveRateLiniterRoutes = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
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

app.use("/api/auth/register", sensitiveRateLiniterRoutes);
app.use("/api/auth", routes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info("Server is running on port %s", PORT);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at: %o, reason: %o", promise, reason);
});
