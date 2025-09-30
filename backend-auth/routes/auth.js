const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { body, validationResult } = require("express-validator")
const crypto = require("crypto")
const sendMail = require("../utils/email")
const nodemailer = require('nodemailer'); 

// Helper to extract bearer token
function getBearerToken(req) {
  const auth = req.headers.authorization || ""
  if (!auth.startsWith("Bearer ")) return null
  return auth.slice("Bearer ".length).trim()
}

// Helper to verify token and fetch user
async function verifyTokenAndGetUser(req) {
  const token = getBearerToken(req)
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.user.id).select("-password")
    return user || null
  } catch {
    return null
  }
}

// Function to send validation errors
function sendValidationErrors(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ msg: "Validation failed", errors: errors.array() })
  }
}

// --- REGISTRATION ROUTE ---
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[a-z]/)
      .withMessage("Password must contain a lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
  ],
  async (req, res) => {
    const currentUser = await verifyTokenAndGetUser(req)
    if (currentUser) {
      return res.status(200).json({ msg: "You are already signed in", user: currentUser })
    }

    const err = sendValidationErrors(req, res)
    if (err) return

    const { name, email, password } = req.body
    const emailNorm = String(email || "").toLowerCase()
    try {
      let user = await User.findOne({ email: emailNorm })
      if (user) {
        return res.status(409).json({ msg: "Email already registered. Please sign in instead." })
      }
      user = new User({ name, email: emailNorm, password })
      await user.save()
      const payload = { user: { id: user.id } }
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 60 * 60 }, (err, token) => {
        if (err) throw err
        res.status(201).json({
          token,
          user: { id: user.id, name: user.name, email: user.email },
        })
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ msg: "Server error" })
    }
  },
)

// --- LOGIN ROUTE ---
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("password").isString().isLength({ min: 1 }).withMessage("Password is required"),
  ],
  async (req, res) => {
    const err = sendValidationErrors(req, res)
    if (err) return

    const { email, password } = req.body
    const emailNorm = String(email || "").toLowerCase()
    try {
      const user = await User.findOne({ email: emailNorm })
      const invalidMsg = { msg: "Invalid email or password" }
      if (!user) {
        return res.status(401).json(invalidMsg)
      }
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json(invalidMsg)
      }

      const payload = { user: { id: user.id } }
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 60 * 60 }, (err, token) => {
        if (err) throw err
        res.json({
          token,
          user: { id: user.id, name: user.name, email: user.email },
        })
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ msg: "Server Error" })
    }
  },
)

// --- FORGOT PASSWORD ROUTE ---
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    let user; // <-- FIX: Define user here to make it accessible in catch block

    try {
        user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        // --- EMAIL SENDING LOGIC ---
        const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password.html?token=${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 10 minutes.</p>
            <a href="${resetUrl}" style="background-color: #3a86ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
        `;

        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"AI Recommender" <${process.env.EMAIL_FROM}>`,
            to: user.email,
            subject: 'Your Password Reset Link',
            html: message,
        });
        
        res.status(200).json({ msg: 'A password reset link has been sent to your email.' });

    } catch (err) {
        console.error("Error in /forgot-password:", err.message);
        // This 'if (user)' check will now work correctly
        if (user) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
        }
        res.status(500).send('Error sending email. Please try again later.');
    }
});

// --- RESET PASSWORD ROUTE ---
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body || {}
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(422).json({ msg: "Password must be at least 8 characters" })
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ msg: "Token is invalid or has expired" })
    }

    user.password = password // pre-save hook will hash it
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return res.status(200).json({ msg: "Password has been successfully reset." })
  } catch (err) {
    console.error(err.message)
    return res.status(500).json({ msg: "Server Error" })
  }
})

// --- CURRENT USER ROUTE ---
router.get("/me", async (req, res) => {
  try {
    const user = await verifyTokenAndGetUser(req)
    if (!user) return res.status(401).json({ msg: "Unauthorized" })
    res.json({ user })
  } catch (e) {
    res.status(500).json({ msg: "Server Error" })
  }
})

module.exports = router
