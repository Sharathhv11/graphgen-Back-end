import CustomError from "../utils/customError.js";
import { verifyJwt } from "../service/JWT.js";
import userModel from "../models/userModel.js";
import handelAsyncFunction from "../utils/asyncFunctionHandler.js";

function getError(){
    return new CustomError(401,"Unauthorized to access the Route");
}

const authorize = handelAsyncFunction(async(req,res,next) => {
    
    //~ series of test will be examined to verify the given token by the user 

    //^ step 1: extract the token from the headers( is user sends in headers instead of httpsOnly cookies)
    const {authorization} = req.headers;

    //^ step 2: if no token is sent send the anauthorized response
    if( !authorization )
            return next(getError());

    //*extract token from the header
    const token = authorization.split(" ")[1];

    //!same as step 2
    if( !token )
        return next(getError());

    //^ verify that the token is valid and issues by our servers
    const decoded = verifyJwt(token);
    
    //^ ensure that the user is in db
    const user = await userModel.findById(decoded.id);

    //^ no user no access
    if( !user )
        return next(new CustomError(401,"User no longer exists."))

    //^ ensure for the password change after issueing the JWT token
    if (user.passwordChangedAt) {
        const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);

        if (decoded.iat < changedTimestamp) {
            return next(new CustomError(401,"Password changed. Please log in again."));
        }
    }

    //? user copy in the req object for the further refernce
    req.user = user;


    //! next() for chaining middleware res.send() for testing purpose
    // res.send("yeah"); 

    next();
})


export default authorize;