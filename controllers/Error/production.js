const production = (error, res) => {
    if (error.isoperational) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message
        });
    } else {
        console.error("ERROR 💥", error);
        res.status(500).json({
            status: "error",
            message: "Something went wrong!"
        });
    }
}

export default production;