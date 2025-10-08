const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// Define the structure of the User document
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  favorites: [
    {
      itemType: {
        type: String,
        enum: ["movie", "book", "music"],
        required: true,
      },
      itemId: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      posterUrl: String,
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
})

// --- Password Hashing Logic --- and Email Normalization
// This special function runs automatically BEFORE a user is saved to the database.
UserSchema.pre("save", async function (next) {
  // Normalize email to lowercase before save
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase()
  }

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next()
  }

  try {
    // Generate a "salt" to make the hash more secure
    const salt = await bcrypt.genSalt(10)
    // Hash the password using the salt
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// Create the User model from the schema and export it
const User = mongoose.model("user", UserSchema)

module.exports = User
