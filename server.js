import dotenv from "dotenv";
import connectDB from "./configure/mongoDB.js"

dotenv.config({
    path:"./.env"
});
import app from "./app.js"

const PORT = 5050 ;

//data base connection call
connectDB();


app.listen(PORT,() => {
    console.log(`server running on port ${PORT}`);
})
