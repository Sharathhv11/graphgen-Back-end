import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import userModel from "../../models/userModel.js";
import CustomError from "../../utils/customError.js";

const getResetPage = (token) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password | ReBook</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f9;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
    }

    .container {
        background: #fff;
        padding: 20px;
        width: 350px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
    }

    h2 {
        margin-bottom: 10px;
        color: #333;
    }

    p {
        font-size: 14px;
        color: #555;
    }

    label {
        display: block;
        margin: 10px 0 5px;
        font-size: 14px;
        text-align: left;
    }

    input {
        width: 95%;
        padding: 8px;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
    }

    button {
        width: 100%;
        background:  #0066ff;
        color: white;
        border: none;
        padding: 10px;
        cursor: pointer;
        font-size: 16px;
        border-radius: 5px;
    }

    button:hover {
        background:rgba(0, 102, 255, 0.83);
    }

    #message {
        margin-top: 10px;
        font-size: 14px;
    }

        </style>
    </head>
    <body>
        <div class="container">
            <h2>Reset Your Password</h2>
            <p>Enter your new password below.</p>
            <form id="resetPasswordForm">
                <label for="password">New Password</label>
                <input type="password" id="password" name="password" placeholder="Enter new password" required>

                <label for="confirmPassword">Re-enter Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter password" required>

                <button type="button" id="submit">Reset Password</button>
            </form>
            <p id="message"></p>
        </div>
       <p id="message"></p>
        </div>
        <script> 

        async function handleSubmit(event) {
            event.preventDefault();

            const pass = document.getElementById("password").value;
            const conf = document.getElementById("confirmPassword").value;
            const message = document.getElementById("message");

            if (pass !== conf) {
                message.textContent = "Passwords do not match!";
                message.style.color = "red";
                return;
            }

            if( pass.length < 8 ){
                message.textContent = "Password is too week!";
                message.style.color = "red";
                return;
            }

            try {
            console.log("/api/auth/reset-password/${token}")
                const response = await fetch("/api/auth/reset-password/${token}", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ password: pass })
                });

                const result = await response.json();

                if (response.ok) {
                    message.textContent = "Password reset successfully!";
                    message.style.color = "green";
                } else {
                    message.textContent = result.message || "An error occurred!";
                    message.style.color = "red";
                }
            } catch (error) {
                message.textContent = "An error occurred!";
                message.style.color = "red";
            }
        }

        const submitBtn = document.getElementById("submit");
        submitBtn.addEventListener("click", handleSubmit);

        </script>
    </body>
    </body>
    </html>`;
};
const passwordResetClient = handelAsyncFunction(async (req, res, next) => {

    //^ first step is to extract the token and verify it exists in out databse

    const {token} = req.params;

    const user = await userModel.findOne({
        token ,
        tokenExpires : { $gt : Date.now()}
    })

    // console.log(user);
    
    //^ is link has expired sending the expired link page
    if( !user ){
        return res.send(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Password | ReBook</title>
                <style>
                    body {
                          font-family: Arial, sans-serif;
                        background-color: #f4f4f9;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .message {
                        text-align: center;
                        color: red;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h1>Reset Password</h1>
                    <p>Your reset password link has expired. Please request a new one.</p>
                </div>
            </body>
            </html>
        `)
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

    user.save();

    //? successfully reseted the password 
    res.status(201).send( {
        status:"Success",
        message:"Password changed successfully"
    })

    
    
});

export { passwordResetClient, passwordResetServer };
