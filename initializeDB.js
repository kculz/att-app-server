const mongoose = require("mongoose");
const createLevelsAndCourses = require("./helpers/createLevelsAndCourses");
require("dotenv").config();

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
        // Run the helper function
        createLevelsAndCourses();
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err.message);
    });