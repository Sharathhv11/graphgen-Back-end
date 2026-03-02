import userModel from "./../../models/userModel.js"
import generateToken from "../../service/token.js";
import mail from "../../service/email.js";
import bcrypt from "bcrypt"
import CustomError from "../../utils/customError.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";

const createUser = handelAsyncFunction( async (req,res,next) => {
    //^verify that the data has been sent by the user

    if(!Object.keys(req.body).length || !req.body.email){ 
        return next(new CustomError(400,"No data was sent."));
    }

    //^verify that the user with same email exists or not 
    const {email} = req.body;
    const userExists = await userModel.findOne({email});

    
    if(userExists && userExists.verified){
        return next(new CustomError(400,"User already exists."));
    }

    //^if user not exists or exists but not verified the email will go through this section of code

    //&here we have created a token and generated the expire time for the token
    const verificationToken = generateToken();
    const expireTime = Date.now() + 10 * 60 * 1000;

    //*user exists and not verified his accound just update the feilds with new one and send the verification mail
    if(userExists && !userExists.verified){
        await userModel.findOneAndUpdate(
            { email: userExists.email },
            { 
                ...req.body,
                password : await bcrypt.hash(req.body.password, +process.env.SALTROUNDS),
                tokenExpires:expireTime,
                token: verificationToken 
            }
        );
    }else{
         //*user not exists create the record and send the verification email to the user
        const data = await userModel.create({
            ...req.body,
            tokenExpires:expireTime,
            verified:false,
            token:verificationToken  
        });
    }

    //^code for generating the link for validation
    const link = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;



    //^this part of the mails the verification link to the users mail address 
    mail(req.body.name,link,email,next);


    //*if everything goes smooth send the 201 resource created successfully 
    res.status(201).send({
        status:"success",
        message:`Email a sent your ${email} address. Please verify your email`
    })
} ); 




export default createUser;