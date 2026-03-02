import crypto from "crypto";

const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString("hex"); // Generates a random hex token
};

export default generateToken;