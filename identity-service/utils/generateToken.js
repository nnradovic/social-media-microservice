const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../src/models/Refreshtoken");

const genereateToken = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

module.exports = genereateToken;
