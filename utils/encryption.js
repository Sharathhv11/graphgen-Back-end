import crypto from "crypto";
import CustomError from "./customError.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Returns the 32-byte encryption key derived from the ENCRYPTION_KEY env var.
 * Throws a CustomError (500) if the env var is missing or malformed.
 */
function getKey() {
  const hex = (process.env.ENCRYPTION_KEY || "").trim();
  if (!hex || hex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    console.error(
      "[encryption] ENCRYPTION_KEY is missing or invalid. " +
      `Got length=${hex.length}. ` +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
    throw new CustomError(
      500,
      "Server encryption configuration error. Please contact the administrator."
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string.
 * @param {string} text – the raw API key
 * @returns {{ iv: string, content: string, tag: string }}
 */
export function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    content: encrypted,
    tag: cipher.getAuthTag().toString("hex"),
  };
}

/**
 * Decrypt a previously encrypted object back to plaintext.
 * @param {{ iv: string, content: string, tag: string }} hash
 * @returns {string} – the original API key
 */
export function decrypt(hash) {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(hash.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(hash.tag, "hex"));

  let decrypted = decipher.update(hash.content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
