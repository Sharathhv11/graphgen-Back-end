import userModel from "../../models/userModel.js";

async function verifyEmail(req,res){

    const {token} = req.params;

    const user = await userModel.findOne({token,tokenExpires:{"$gt":Date.now()}});

    if(!user){
     res.status(400).send({
            status:"failed",
            message:"link expired!. Please sign-up again."
        });
        return;
    }

    if (user.verified) {
        return res.status(400).send({
            status: "failed",
            message: "Email is already verified!"
        });
    } 

    user.verified = true;
    user.token = null;
    user.tokenExpires = null;

    await user.save();

    res.status(200).send({
        status:"success",
        message:"Successfully completed account creation process."
    });
}

export default verifyEmail;