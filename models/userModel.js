import mongoose from "mongoose";
import bcrypt from "bcrypt";

//? User schema of the application
const userScheme = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /\S+@\S+\.\S+/.test(v);
        },
        message: "Please provide a valid email address.",
      },
    },

    password: {
      type: String,
      // Required only for "local" (email/password) users — Google users don't set a password
      required: function () {
        return this.authProvider === "local";
      },
      select: false,
      minlength: 8,
      maxlength: 100,
    },

    // ── Authentication provider ──
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Google OAuth fields
    googleId: {
      type: String,
      default: null,
      sparse: true, // Allows null but enforces uniqueness on non-null values
    },

    profileImage: {
      type: String,
      default: null,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    token: {
      type: String,
      default: null,
    },

    tokenExpires: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // Encrypted Gemini API key (AES-256-GCM components)
    geminiApiKey: {
      iv:      { type: String, default: null },
      content: { type: String, default: null },
      tag:     { type: String, default: null },
    },
  },
  { timestamps: true }
);

//  Hash password before saving
userScheme.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, +process.env.SALTROUNDS);
  this.passwordChangedAt = Date.now();
  next();
});

//  Compare password method
userScheme.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

const userModel = mongoose.model("User", userScheme);

export default userModel;
