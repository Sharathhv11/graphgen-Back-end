import userModel from "../../models/userModel.js";
import { encrypt } from "../../utils/encryption.js";
import handleAsync from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * POST /api/auth/api-key
 * Save or update the user's Gemini API key (encrypted).
 */
export const saveApiKey = handleAsync(async (req, res, next) => {
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
    return next(
      new CustomError(400, "Please provide a valid API key (minimum 10 characters).")
    );
  }

  // Encrypt the key before persisting
  const encrypted = encrypt(apiKey.trim());

  await userModel.findByIdAndUpdate(req.user._id, {
    geminiApiKey: {
      iv: encrypted.iv,
      content: encrypted.content,
      tag: encrypted.tag,
    },
  });

  res.status(200).json({
    status: "success",
    message: "API key saved securely.",
    data: { hasApiKey: true },
  });
});

/**
 * GET /api/auth/api-key/status
 * Returns whether the user has a stored API key (never exposes the key).
 */
export const getApiKeyStatus = handleAsync(async (req, res, next) => {
  const user = await userModel.findById(req.user._id).select("geminiApiKey");

  const hasApiKey = !!(
    user?.geminiApiKey?.iv &&
    user?.geminiApiKey?.content &&
    user?.geminiApiKey?.tag
  );

  res.status(200).json({
    status: "success",
    data: { hasApiKey },
  });
});

/**
 * DELETE /api/auth/api-key
 * Remove the user's stored API key.
 */
export const deleteApiKey = handleAsync(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user._id, {
    $unset: { geminiApiKey: "" },
  });

  res.status(200).json({
    status: "success",
    message: "API key removed.",
    data: { hasApiKey: false },
  });
});
