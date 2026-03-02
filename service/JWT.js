import jwt from "jsonwebtoken";


export const getJWT = (data) => {
    const token = jwt.sign(data, process.env.SECRECT_CODE,{ 
        expiresIn: "1h"
    });

    return token;
}


export const verifyJwt = (token) => {
    return jwt.verify(token, process.env.SECRECT_CODE);
}
