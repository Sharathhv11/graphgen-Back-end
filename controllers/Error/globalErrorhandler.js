import developmentError from "./developmentError.js"


const globalErrorHandler = (error, req, res, next) => {

    //^if the error caused is not by the mistake of user its internal server error
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";
    
    //~ sending the different format for application in the prodution and one in development 
    if( process.env.NODE_ENV === "DEV"){
        developmentError(error,res);
        return;
    }

    
}


export default globalErrorHandler;