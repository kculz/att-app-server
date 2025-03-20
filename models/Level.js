const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LevelSchema = new Schema({
  name: { type: String, required: true, unique: true }, // Level name (unique)
  description: { type: String }, // Optional level description
});

const Level = mongoose.model("Level", LevelSchema);

module.exports = Level;