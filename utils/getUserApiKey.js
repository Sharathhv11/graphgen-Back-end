import userModel from "../models/userModel.js";
import { decrypt } from "./encryption.js";
import CustomError from "./customError.js";

/**
 * Retrieves and decrypts the authenticated user's Gemini API key.
 *
 * Usage inside any diagram controller:
 *   const apiKey = await getUserApiKey(req.user._id, next);
 *   if (!apiKey) return;          // error already sent via next()
 *
 * Falls back to process.env.GEMINI_API when the user hasn't configured
 * their own key (preserves backward compatibility during transition).
 *
 * @param {string|ObjectId} userId – from req.user._id (set by authorize middleware)
 * @param {Function} next – Express next() to forward errors
 * @returns {string|null} – decrypted API key, or null if error was forwarded
 */
export async function getUserApiKey(userId, next) {
  // 1. Try the user's own key
  const user = await userModel.findById(userId).select("geminiApiKey");

  if (user?.geminiApiKey?.iv && user?.geminiApiKey?.content && user?.geminiApiKey?.tag) {
    try {
      return decrypt(user.geminiApiKey);
    } catch (err) {
      next(new CustomError(500, "Failed to decrypt your API key. Please re-save it."));
      return null;
    }
  }

  // 2. Fallback: platform-wide key (legacy / development convenience)
  if (process.env.GEMINI_API) {
    return process.env.GEMINI_API;
  }

  // 3. No key at all
  next(
    new CustomError(
      403,
      "No API key configured. Please add your Gemini API key in your profile settings."
    )
  );
  return null;
}
