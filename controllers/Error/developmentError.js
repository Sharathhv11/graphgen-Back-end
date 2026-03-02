

//! this is a function that respondse to the request in a detailed 
//! information about the error casued in the application in development mode

function developmentError(error,res){
    res.status(error.statusCode).send({
        status : error.status,
        message : error.message,
        "stack Trace" : error.stack,
        error 
    });
}

export default developmentError;