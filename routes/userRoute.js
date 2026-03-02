import express from "express"
import createUser from "../controllers/authentication/createUser.js";
import verifyEmail from "../controllers/authentication/verifyEmail.js";
import login from "../controllers/authentication/login.js";
import authorize from "../controllers/authorization.js";
import { forgotPassword } from "../controllers/authentication/password.js";
import { passwordResetClient, passwordResetServer } from "../controllers/authentication/resetPassword.js";
import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
	limit: 5,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
    message:{
        status:"failed",
        message:"Too many attempts try after sometimes."
    }
})

const userRouter = express.Router();

userRouter.post("/sign-up",createUser);
userRouter.get("/verify/:token",verifyEmail);
userRouter.post("/login",login);
userRouter.post("/forgot-password",limiter,forgotPassword);
userRouter.get("/reset-password/:token",passwordResetClient);
userRouter.post("/reset-password/:token",limiter,passwordResetServer);


export default userRouter;