import userModel from "../../models/userModel.js";

const generateHTML = (title, message, isSuccess) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { padding: 40px 0; text-align: center; background-color: #ffffff; }
    .logo { width: 180px; height: auto; }
    .content { padding: 0 40px 40px 40px; text-align: left; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: ${isSuccess ? '#10b981' : '#ef4444'}; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; color: #475569; margin-bottom: 32px; text-align: center; }
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
          <img src="https://img.icons8.com/wired/128/000000/mind-map.png" alt="GraphGen" class="logo">
        </td>
      </tr>
      <tr>
        <td class="content">
          <h1 class="title">${title}</h1>
          <p class="text">${message}</p>
          <div class="button-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Go to Login</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; 2024 GraphGen. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

async function verifyEmail(req,res){

    const {token} = req.params;

    const user = await userModel.findOne({token,tokenExpires:{"$gt":Date.now()}});

    if(!user){
        res.status(400).send(generateHTML("Link Expired", "Your verification link has expired or is invalid. Please sign up again.", false));
        return;
    }

    if (user.verified) {
        return res.status(400).send(generateHTML("Already Verified", "Your email address is already verified! You can proceed to log in.", false));
    } 

    user.verified = true;
    user.token = null;
    user.tokenExpires = null;

    await user.save();

    res.status(200).send(generateHTML("Verification Successful", "Successfully completed account creation process. You can now log in.", true));
}

export default verifyEmail;