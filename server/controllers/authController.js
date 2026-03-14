const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError, sendServerError } = require("../utils/http");
const { normalizeEmail } = require("../utils/request");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toAuthUser(user) {
  return {
    id: user._id,
    email: user.email,
  };
}

function validateAuthPayload(email, password) {
  if (!email || !password) {
    return "email and password are required";
  }

  return null;
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function signup(req, res) {
  try {
    const { email, password } = req.body;
    const payloadError = validateAuthPayload(email, password);

    if (payloadError) {
      return sendError(res, 400, payloadError);
    }

    if (!isValidEmail(email)) {
      return sendError(res, 400, "Please provide a valid email address");
    }

    if (String(password).length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters");
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return sendError(res, 409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
    });

    const token = createToken(user);

    return res.status(201).json({
      token,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return sendServerError(res, "Failed to sign up user");
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const payloadError = validateAuthPayload(email, password);

    if (payloadError) {
      return sendError(res, 400, payloadError);
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password");
    }

    const token = createToken(user);

    return res.json({
      token,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return sendServerError(res, "Failed to login user");
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("_id email createdAt");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Me endpoint error:", error.message);
    return sendServerError(res, "Failed to fetch user profile");
  }
}

module.exports = { signup, login, me };
