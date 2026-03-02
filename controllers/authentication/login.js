import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import userModel from "../../models/userModel.js";
import {getJWT} from "../../service/JWT.js";

const login = handelAsyncFunction(async (req,res,next)=>{
    
    //~i need to go through the series of checks to to allow user to login
    
    //^ step 1: verify that user have sent the email and password

    const { email, password } = req.body;

    if( !email || !password )
            return next(new CustomError(400,"Email and password are the required feild to login."));


    //^ step 2: verify user exists and verified their email address
    const user = await userModel.findOne({email}).select("+password");

    if( !user || !user.verified){
        return next(new CustomError(401,`No user is registered with e-mail ${email}. Please create the account.`))
    }

    //^ step 3: compare the sent password with the hashed password on the database
    const result = await  user.comparePassword(password,user.password);

    if(!result)
            return next(new CustomError(401,"Invalid password!."))

    
    //^ step 4: now we assign the token to the user 

    const JWT = getJWT({
        id:user._id,
        email:user.email,
        username:user.username
    });

    //^ in response send the status code and jwt for the user
    res.status(200).send({
        status:"success",
        message:`login to account ${user.username} is successfully.`,
        token:JWT
    });

})


export default login;