const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  name: { type: String, required: true, unique: true }, // Course name (unique)
  description: { type: String }, // Optional course description
});

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;