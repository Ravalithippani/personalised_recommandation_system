require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors") // Simpler CORS setup for local dev
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const app = express()

// --- Middleware ---
app.disable("x-powered-by")

// THIS IS THE FIX: Use a simpler CORS setup that allows all origins for local development
app.use(cors())

app.use(helmet())
app.use(express.json())

// Ensure critical envs are present
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set.")
  process.exit(1)
}
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is not set.")
  process.exit(1)
}

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB connected successfully!")
  } catch (err) {
    console.error("MongoDB connection error:", err.message)
    process.exit(1)
  }
}
connectDB()

// --- Define Routes ---
app.get("/", (req, res) => {
  res.json({ message: "Auth API is running and connected to MongoDB." })
})

// Per-route rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many requests, please try again later." },
})

app.use("/api/auth", authLimiter, require("./routes/auth"))

// --- Start Server ---
const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`)
})
