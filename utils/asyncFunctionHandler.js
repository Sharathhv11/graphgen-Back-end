const handelAsyncFunction = (fx)=>{
    return (req,res,next)=>{
      fx(req,res,next).catch(err => {
        next(err)
    });
    }
  }

export default handelAsyncFunction;