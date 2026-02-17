const genereateToken = require("../../utils/generateToken");
const logger = require("../../utils/logger");
const { validateRegistration } = require("../../utils/validation");

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

module.exports = {
  registerUser,
};
