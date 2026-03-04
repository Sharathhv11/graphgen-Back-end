import express from "express";
import cors from "cors";
import userRoute from "./routes/userRoute.js"
import diagramGenerator from "./routes/diagram.js";
import globalErrorHandler from "./controllers/Error/globalErrorhandler.js";
import CustomError from "./utils/customError.js";

const app = express();


//^ CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

//^middleware for the post body data
app.use(express.json())

//^ Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is healthy and running"
    });
});

//^ router that manages the authentication functionality
app.use("/api/auth",userRoute);

//^ route for handling diagram generation
app.use("/api/diagram",diagramGenerator);

//^ middleware for serving the static files
// app.use(express.static("public"));


//^ 404 route middleware
app.use("*",(req,res,next)=>{
    next(new CustomError(404,`${req.baseUrl} not found in our server.`))
})

//^global error handler
app.use(globalErrorHandler);


export default app;

