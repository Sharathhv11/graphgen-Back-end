import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import userModel from "../../models/userModel.js";
import CustomError from "../../utils/customError.js";

const generateErrorPage = (title, message) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | GraphGen</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 450px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { padding: 40px 0 20px 0; text-align: center; background-color: #ffffff; }
    .logo { width: 100px; height: auto; }
    .content { padding: 0 40px 40px 40px; text-align: left; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #ef4444; margin-bottom: 15px; text-align: center; }
    .text { font-size: 15px; color: #475569; margin-bottom: 25px; text-align: center; }
    .footer { padding: 24px 40px; background-color: #f1f5f9; text-align: center; font-size: 13px; color: #64748b; }
    @media screen and (max-width: 600px) { .main { border-radius: 0; height: 100vh; max-width: 100%; } .content { padding: 0 24px 40px 24px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
        <div class="header">
          <img src="https://img.icons8.com/wired/128/000000/mind-map.png" alt="GraphGen" class="logo">
        </div>
        <div class="content">
          <h2 class="title">${title}</h2>
          <p class="text">${message}</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 GraphGen. All rights reserved.</p>
        </div>
    </div>
  </div>
</body>
</html>
`;

const getResetPage = (token) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password | GraphGen</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 450px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { padding: 40px 0 20px 0; text-align: center; background-color: #ffffff; }
    .logo { width: 100px; height: auto; }
    .content { padding: 0 40px 40px 40px; text-align: left; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 15px; text-align: center; }
    .text { font-size: 15px; color: #475569; margin-bottom: 25px; text-align: center; }
    
    .form-group { margin-bottom: 20px; text-align: left; }
    .form-group label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #334155; }
    .form-group input { width: 100%; box-sizing: border-box; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; outline: none; transition: border-color 0.2s; }
    .form-group input:focus { border-color: #000000; }
    
    .button-container { text-align: center; margin-top: 10px; }
    .button { background-color: #000000; color: #ffffff !important; padding: 14px 24px; width: 100%; border: none; cursor: pointer; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
    .button:hover { background-color: #333333; }
    .button:disabled { background-color: #94a3b8; cursor: not-allowed; }
    
    #message { margin-top: 20px; font-size: 14px; text-align: center; font-weight: 500; }
    
    .footer { padding: 24px 40px; background-color: #f1f5f9; text-align: center; font-size: 13px; color: #64748b; }
    @media screen and (max-width: 600px) { .main { border-radius: 0; height: 100vh; max-width: 100%; } .content { padding: 0 24px 40px 24px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
        <div class="header">
          <img src="https://img.icons8.com/wired/128/000000/mind-map.png" alt="GraphGen" class="logo">
        </div>
        <div class="content">
          <h2 class="title" id="main-title">Reset Your Password</h2>
          <p class="text" id="sub-text">Enter your new password below.</p>
          
          <form id="resetPasswordForm">
            <div class="form-group">
                <label for="password">New Password</label>
                <input type="password" id="password" name="password" placeholder="Enter new password" required>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Re-enter Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter password" required>
            </div>
            <div class="button-container">
                <button type="button" class="button" id="submit">Reset Password</button>
            </div>
          </form>
          <p id="message"></p>
        </div>
        <div class="footer">
          <p>&copy; 2024 GraphGen. All rights reserved.</p>
        </div>
    </div>
  </div>

  <script> 
    async function handleSubmit(event) {
        event.preventDefault();

        const pass = document.getElementById("password").value;
        const conf = document.getElementById("confirmPassword").value;
        const message = document.getElementById("message");
        const submitBtn = document.getElementById("submit");

        if (pass !== conf) {
            message.textContent = "Passwords do not match!";
            message.style.color = "#ef4444";
            return;
        }

        if(pass.length < 8){
            message.textContent = "Password must be at least 8 characters long!";
            message.style.color = "#ef4444";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Resetting...";
        message.textContent = "";

        try {
            const response = await fetch("/api/auth/reset-password/${token}", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password: pass })
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById("resetPasswordForm").style.display = "none";
                document.getElementById("main-title").textContent = "Success!";
                document.getElementById("main-title").style.color = "#10b981";
                document.getElementById("sub-text").textContent = "Your password has been successfully reset. You can now close this page and log in.";
                message.textContent = "";
            } else {
                message.textContent = result.message || "An error occurred!";
                message.style.color = "#ef4444";
                submitBtn.disabled = false;
                submitBtn.textContent = "Reset Password";
            }
        } catch (error) {
            message.textContent = "An error occurred. Please try again.";
            message.style.color = "#ef4444";
            submitBtn.disabled = false;
            submitBtn.textContent = "Reset Password";
        }
    }

    const submitBtn = document.getElementById("submit");
    submitBtn.addEventListener("click", handleSubmit);
  </script>
</body>
</html>`;
};

const passwordResetClient = handelAsyncFunction(async (req, res, next) => {

    //^ first step is to extract the token and verify it exists in out databse
    const {token} = req.params;

    const user = await userModel.findOne({
        token ,
        tokenExpires : { $gt : Date.now()}
    });

    //^ is link has expired sending the expired link page
    if( !user ){
        return res.send(generateErrorPage("Link Expired", "Your reset password link has expired or is invalid. Please request a new one."));
    }

    //? if not send the reset password form for the user
    res.send(getResetPage(token));
});

const passwordResetServer = handelAsyncFunction(async(req, res,next) => {
    
    const {token} = req.params;
    
    //^ ensure that link is valid by finding token on db
    const user = await userModel.findOne({
        token ,
        tokenExpires : { $gt : Date.now()}
    });

    //^ if link has expired send the error of expired link 
    if( !user ){
        return next(new CustomError(401,"Link has expired. Please try again before within 10mins of link generation."));   
    }

    //~extract the password
    const {password} = req.body;

    //^modify the reset related feilds on db
    user.password = password;
    user.token = null;
    user.tokenExpires = null;

    await user.save();

    //? successfully reseted the password 
    res.status(201).send( {
        status:"Success",
        message:"Password changed successfully"
    })
    
});

export { passwordResetClient, passwordResetServer };
