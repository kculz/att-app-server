const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true }, // User's full name
  nationalID: { type: String, required: true, unique: true }, // User's National ID (unique)
  email: { type: String, required: true, unique: true }, // User's email (unique)
  password: { type: String, required: true }, // Hashed password
  phone: { type: String, required: false },
  role: {
    type: String,
    required: true,
    enum: ["student", "supervisor", "super-admin"], // Allowed roles
    default: "student", // Default role
  },
  course: { type: Schema.Types.ObjectId, ref: "Course" }, // Reference to Course model
  level: { type: Schema.Types.ObjectId, ref: "Level" }, // Reference to Level model
  fee: { type: Schema.Types.ObjectId, ref: "Fee" },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;