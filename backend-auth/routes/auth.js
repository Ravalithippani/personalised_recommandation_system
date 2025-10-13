const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

// Initialize Google OAuth2 client with the client ID from .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to verify JWT token
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key_here"
    );
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        return res.status(409).json({ msg: "Email already registered" });
      }

      user = new User({ name, email: email.toLowerCase(), password });
      await user.save();

      const payload = { user: { id: user.id } };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your_jwt_secret_key_here",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      // Only check password if user has one (i.e., not Google-authenticated)
      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ msg: "Invalid credentials" });
        }
      } else {
        return res
          .status(401)
          .json({ msg: "This account uses Google Sign-In" });
      }

      const payload = { user: { id: user.id } };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your_jwt_secret_key_here",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST /api/auth/google
// @desc    Authenticate user with Google and get token
router.post("/google", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ msg: "No token provided" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name, sub: googleId } = payload;

    // Check if user exists, if not create a new one
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create new user with googleId, no password
      user = new User({
        name,
        email: email.toLowerCase(),
        googleId,
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google ID if user exists but wasn't previously linked
      user.googleId = googleId;
      await user.save();
    } else if (user.googleId !== googleId) {
      // Handle case where Google ID mismatch (security check)
      return res.status(400).json({ msg: "Google account mismatch" });
    }

    // Generate JWT token
    const payloadForToken = { user: { id: user.id } };
    const jwtToken = jwt.sign(
      payloadForToken,
      process.env.JWT_SECRET || "your_jwt_secret_key_here",
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(400).json({ msg: "Google sign-in failed. Please try again." });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
router.post(
  "/change-password",
  [
    auth,
    check("currentPassword", "Current password is required").exists(),
    check("newPassword", "New password must be at least 6 characters").isLength(
      { min: 6 }
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);
      // Only check current password if user has one (i.e., not Google-authenticated)
      if (user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ msg: "Current password is incorrect" });
        }
      } else {
        return res
          .status(400)
          .json({
            msg: "Cannot change password for Google-authenticated account",
          });
      }

      user.password = newPassword;
      await user.save();

      res.json({ msg: "Password changed successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET /api/auth/favorites
// @desc    Get user's favorites
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("favorites");
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/favorites
// @desc    Toggle a favorite (add if not exists, remove if exists)
router.post("/favorites", auth, async (req, res) => {
  const { itemType, itemId, title, posterUrl } = req.body;

  if (!itemType || !itemId || !title) {
    return res
      .status(400)
      .json({ msg: "itemType, itemId, and title are required" });
  }

  try {
    const user = await User.findById(req.user.id);

    // Check if already favorited
    const existingIndex = user.favorites.findIndex(
      (fav) => fav.itemId === itemId && fav.itemType === itemType
    );

    if (existingIndex !== -1) {
      // Remove from favorites
      user.favorites.splice(existingIndex, 1);
      await user.save();
      return res.json({
        msg: "Removed from favorites",
        favorites: user.favorites,
        action: "removed",
      });
    } else {
      // Add to favorites
      user.favorites.push({ itemType, itemId, title, posterUrl });
      await user.save();
      return res.json({
        msg: "Added to favorites",
        favorites: user.favorites,
        action: "added",
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/auth/favorites/:id
// @desc    Remove a favorite
router.delete("/favorites/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(
      (fav) => fav._id.toString() !== req.params.id
    );
    await user.save();

    res.json({ msg: "Removed from favorites", favorites: user.favorites });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
