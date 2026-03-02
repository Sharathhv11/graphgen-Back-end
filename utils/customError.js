class CustomError extends Error{
    constructor(statusCode,message){
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode>=400 && statusCode<500 ? "fail" : "error";
        this.isoperational = true;

        Error.captureStackTrace(this,CustomError)
    }
}


export default CustomError;