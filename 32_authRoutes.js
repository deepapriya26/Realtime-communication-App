const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET || "secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      return res.status(409).json({ error: `This ${field} is already taken` });
    }

    // Create user (password hashed in model pre-save hook)
    const user = await User.create({ username, email, password });

    const token = generateToken(user);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages[0] });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Include password field (excluded by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save({ validateModifiedOnly: true });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get("/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (protected)
 */
router.post("/refresh", authMiddleware, async (req, res) => {
  const token = generateToken(req.user);
  res.json({ token });
});

module.exports = router;
