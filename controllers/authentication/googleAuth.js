import { OAuth2Client } from "google-auth-library";
import userModel from "../../models/userModel.js";
import { getJWT } from "../../service/JWT.js";
import handleAsync from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 *
 * Accepts a Google credential (ID token) from the frontend,
 * verifies it server-side, then either logs in an existing user
 * or auto-registers a new one. Returns a platform JWT.
 */
const googleAuth = handleAsync(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return next(new CustomError(400, "Google credential is required."));
  }

  // ── Step 1: Verify the Google ID token ──
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error("[googleAuth] Token verification failed:", err.message);
    return next(
      new CustomError(401, "Invalid or expired Google token. Please try again.")
    );
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    return next(
      new CustomError(401, "Google email is not verified. Please verify your Google email first.")
    );
  }

  // ── Step 2: Find or create the user ──
  let user = await userModel.findOne({ email });

  if (user) {
    // User exists — link Google ID if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.profileImage = picture || user.profileImage;
      // If the user signed up via email but never verified, auto-verify them
      if (!user.verified) user.verified = true;
      await user.save({ validateModifiedOnly: true });
    }
  } else {
    // New user — auto-register with Google profile data
    user = await userModel.create({
      name: name || email.split("@")[0],
      email,
      authProvider: "google",
      googleId,
      profileImage: picture || null,
      verified: true, // Google already verified the email
    });
  }

  // ── Step 3: Issue platform JWT ──
  const JWT = getJWT({
    id: user._id,
    email: user.email,
  });

  res.status(200).json({
    status: "success",
    message: `Welcome, ${user.name}!`,
    token: JWT,
    user: {
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    },
  });
});

export default googleAuth;
