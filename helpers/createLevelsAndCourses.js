const Level = require("../models/Level"); // Import the Level model
const Course = require("../models/Course"); // Import the Course model

const createLevelsAndCourses = async () => {
    try {
        // Create levels from 1.1 to 4.4
        const levels = [];
        for (let year = 1; year <= 4; year++) {
            for (let semester = 1; semester <= 2; semester++) {
                const levelName = `${year}.${semester}`;
                const levelDescription = `Year ${year}, Semester ${semester}`;
                levels.push({ name: levelName, description: levelDescription });
            }
        }

        // Save levels to the database
        await Level.insertMany(levels);
        console.log("Levels created successfully!");

        // Create courses
        const courses = [
            {
                name: "Hon Software Eng",
                description: "Honors in Software Engineering",
            },
            {
                name: "Hon Information Tech",
                description: "Honors in Information Technology",
            },
            {
                name: "Master Software Eng",
                description: "Masters in Software Engineering",
            },
            {
                name: "Master Information Tech",
                description: "Masters in Information Technology",
            },
            {
                name: "Bachelor Computer Science",
                description: "Bachelor in Computer Science",
            },
            {
                name: "Bachelor Data Science",
                description: "Bachelor in Data Science",
            },
        ];

        // Save courses to the database
        await Course.insertMany(courses);
        console.log("Courses created successfully!");
    } catch (err) {
        console.error("Error creating levels and courses:", err.message);
    }
};

module.exports = createLevelsAndCourses;