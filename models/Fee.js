const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FeeSchema = new Schema({
  isPaid: { type: Boolean, default: false }, // Fee payment status
  amount: { type: Number, required: true }, // Fee amount
});

const Fee = mongoose.model("Fee", FeeSchema);

module.exports = Fee;