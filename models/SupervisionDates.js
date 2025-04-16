const mongoose = require("mongoose");
const { Schema } = mongoose;

const SupervisionDatesSchema = new Schema({
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model("SupervisionDates", SupervisionDatesSchema);