const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { body, validationResult } = require("express-validator")
const crypto = require("crypto")
const sendMail = require("../utils/email")

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
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {}
  try {
    const emailNorm = String(email || "").toLowerCase()
    const user = await User.findOne({ email: emailNorm })
    if (!user) {
      // Avoid user enumeration
      return res.status(200).json({ msg: "If a user with that email exists, a reset link has been sent." })
    }

    // Generate and store hashed token with expiry (10 minutes)
    const resetToken = crypto.randomBytes(20).toString("hex")
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000
    await user.save()

    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5500"
    const resetUrl = `${frontendOrigin.replace(/\/$/, "")}/reset-password.html?token=${resetToken}`

    // Send email via SMTP (falls back to console if delivery fails)
    try {
      await sendMail({
        to: user.email,
        subject: "Reset your Globe password",
        text: `We received a request to reset your password.\n\nUse the link below within 10 minutes:\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
        html: `
          <div style="font-family:Inter,system-ui,Arial,sans-serif;max-width:560px;margin:auto;padding:16px;border:1px solid #eee;border-radius:12px">
            <h2 style="margin:0 0 8px;color:#0a0a0a">Reset your password</h2>
            <p style="color:#333;line-height:1.6">We received a request to reset your password. Click the button below within 10 minutes.</p>
            <p style="margin:16px 0">
              <a href="${resetUrl}" style="display:inline-block;background:#4ecdc4;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none">Reset Password</a>
            </p>
            <p style="color:#555;line-height:1.6">If the button doesn't work, copy and paste this link:<br/><a href="${resetUrl}">${resetUrl}</a></p>
            <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error("Email send failed, showing link in logs as fallback:", mailErr.message)
      console.log("Password reset link (fallback):", resetUrl)
      // Do not change response to avoid enumeration or leaking errors
    }

    return res.status(200).json({ msg: "If a user with that email exists, a reset link has been sent." })
  } catch (err) {
    console.error(err.message)
    return res.status(500).json({ msg: "Server Error" })
  }
})

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
