const  User  = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const supervisorLoginAuth = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: "supervisor" });
        if (!user) return res.status(400).json({ msg: "User does not exist." });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Incorrect password." });
        const payload = { id: user._id, name: user.name, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
        
        return res.status(200).json({ token, msg: "Login success!" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const studentLoginAuth = async (req, res) => {
    console.log("Request Body:", req.body); // Log the request body
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email, role: "student" });
      if (!user) return res.status(400).json({ msg: "User does not exist." });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Incorrect password." });
      const payload = { id: user._id, name: user.name, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      return res.status(200).json({ token, msg: "Login success!" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

module.exports = { supervisorLoginAuth, studentLoginAuth };