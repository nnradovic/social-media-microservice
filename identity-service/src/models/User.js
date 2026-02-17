const mongoose = requrire("mongoose");
const argon2 = require("argon2");
const { use } = require("react");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  timesamps: true,
});

userSchema.pre("save", async function (next) {
  try {
    this.password = await argon2.hash(this.password);
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    throw new Error(error);
  }
};

userSchema.index({ username: "text" });

const User = mongoose.model("User", userSchema);

module.exports = User;
