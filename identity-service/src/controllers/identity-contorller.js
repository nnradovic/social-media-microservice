const genereateToken = require("../../utils/generateToken");
const logger = require("../../utils/logger");
const {
  validateRegistration,
  validateLogin,
} = require("../../utils/validation");
const RefreshToken = require("../models/Refreshtoken");
const User = require("../models/User");

const registerUser = async (req, res) => {
  logger.info("Registering user with data: %o", req.body);

  try {
    const { error, value } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation failed: %s", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn(
        "User already exists with email: %s or username: %s",
        email,
        username,
      );
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.info("User registered successfully: %s", username);

    const { accessToken, refreshToken } = await genereateToken(user);
    res.status(201).json({
      success: true,
      message: "User registered",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error registering user: %o", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  logger.info("Logging in user with data: %o", req.body);

  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation failed: %s", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("User not found with email: %s", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password for email: %s", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = await genereateToken(user);
    logger.info("User logged in successfully: %s", email);
    res.json({
      success: true,
      message: "User logged in",
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Error logging in user: %o", error);
    res.status(500).json({ message: "Server error" });
  }
};

const refreshToken = async (req, res) => {
  logger.info("Refreshing token with data: %o", req.body);
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("No refresh token provided");
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const storeToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storeToken || storeToken.expiresAt < Date.now()) {
      logger.warn("Invalid refresh token: %s", refreshToken);
      return res.status(400).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(storeToken.user);

    if (!user) {
      logger.warn("User not found for refresh token: %s", refreshToken);
      return res.status(400).json({ message: "Invalid refresh token" });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await genereateToken(user);

    await RefreshToken.deleteOne({ id: storeToken._id });
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Error refreshing token: %o", error);
    res.status(500).json({ message: "Server error" });
  }
};

const logoutUser = async (req, res) => {
  logger.info("Logging out user with data: %o", req.body);
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("No refresh token provided for logout");
      return res.status(400).json({ message: "Refresh token is required" });
    }
    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info(
      "User logged out successfully with refresh token: %s",
      refreshToken,
    );
    res.json({ success: true, message: "User logged out" });
  } catch (error) {
    logger.error("Error logging out user: %o", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};
