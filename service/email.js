import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic Branding Icons
const LOGO_URL = "https://img.icons8.com/wired/128/000000/mind-map.png"; // Professional placeholder graph icon

// Configure Brevo client
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Sender configuration from environment variables
const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL || "batman11login@gmail.com",
  name: process.env.BREVO_SENDER_NAME || "GraphGen Support",
};

/**
 * Send Email Verification Mail (Onboarding)
 */
async function mail(name, link, toEmail) {
  try {
    await transactionalEmailApi.sendTransacEmail({
      sender: SENDER,
      to: [{ email: toEmail }],
      subject: "Welcome to GraphGen! Verify Your Email",
      textContent: `Hello ${name}, Welcome to GraphGen! Please verify your email: ${link}`,
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { padding: 40px 0; text-align: center; background-color: #ffffff; }
    .logo { width: 180px; height: auto; }
    .content { padding: 0 40px 40px 40px; text-align: left; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; color: #475569; margin-bottom: 32px; }
    .button-container { text-align: center; margin-bottom: 32px; }
    .button { background-color: #000000; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
    .footer { padding: 32px 40px; background-color: #f1f5f9; text-align: center; font-size: 14px; color: #64748b; }
    .footer a { color: #000000; text-decoration: none; font-weight: 500; }
    @media screen and (max-width: 600px) { .main { margin-top: 0; border-radius: 0; } .content { padding: 0 20px 40px 20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main">
      <tr>
        <td class="header">
          <img src="${LOGO_URL}" alt="GraphGen" class="logo">
        </td>
      </tr>
      <tr>
        <td class="content">
          <h1 class="title">Welcome to GraphGen, ${name}!</h1>
          <p class="text">We're thrilled to have you join our community of intelligent visualizers. To get started and secure your account, please verify your email address by clicking the button below.</p>
          <div class="button-container">
            <a href="${link}" class="button">Verify Email Address</a>
          </div>
          <p class="text">If you didn't create an account with GraphGen, you can safely ignore this email.</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; 2024 GraphGen. All rights reserved.</p>
          <p><a href="https://graphgen.com">Visit our website</a> &bull; <a href="mailto:support@graphgen.com">Support</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
      `,
    });
  } catch (error) {
    console.error("Brevo verification email failed:", error);
    return error;
  }
}

/**
 * Send Forgot Password Mail
 */
async function mailForgotPassword(name, link, toEmail) {
  try {
    await transactionalEmailApi.sendTransacEmail({
      sender: SENDER,
      to: [{ email: toEmail }],
      subject: "Reset Your Password - GraphGen",
      textContent: `Hello ${name}, Reset your password: ${link}`,
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { padding: 40px 0; text-align: center; background-color: #ffffff; }
    .logo { width: 180px; height: auto; }
    .content { padding: 0 40px 40px 40px; text-align: left; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; color: #475569; margin-bottom: 32px; }
    .button-container { text-align: center; margin-bottom: 32px; }
    .button { background-color: #007bff; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
    .footer { padding: 32px 40px; background-color: #f1f5f9; text-align: center; font-size: 14px; color: #64748b; }
    .footer a { color: #000000; text-decoration: none; font-weight: 500; }
    @media screen and (max-width: 600px) { .main { margin-top: 0; border-radius: 0; } .content { padding: 0 20px 40px 20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main">
      <tr>
        <td class="header">
          <img src="${LOGO_URL}" alt="GraphGen" class="logo">
        </td>
      </tr>
      <tr>
        <td class="content">
          <h1 class="title">Password Reset Request</h1>
          <p class="text">Hello <strong>${name}</strong>,<br><br>We received a request to reset the password for your GraphGen account. If you made this request, please click the button below to set a new password. This link will expire in 10 minutes.</p>
          <div class="button-container">
            <a href="${link}" class="button">Reset Password</a>
          </div>
          <p class="text">If you didn't request a password reset, you can safely ignore this email.</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; 2024 GraphGen. All rights reserved.</p>
          <p><a href="https://graphgen.com">Visit our website</a> &bull; <a href="mailto:support@graphgen.com">Support</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
      `,
    });
  } catch (error) {
    console.error("Brevo forgot-password email failed:", error);
    return error;
  }
}

export default mail;
export { mailForgotPassword };