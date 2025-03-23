const express = require("express");
const http = require('http');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000; // Corrected the order to prioritize environment variable
const mongoose = require("mongoose");
const cors = require("cors");
const { initializeWebSockets } = require("./controllers/websocket"); 
  
 
app.use(cors({
  origin: "*", // Allow all origins (for development only)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Routes
app.use("/api/v1/auth", require("./routes/authRoute"));
app.use("/api/v1/user", require("./routes/userRoute"));
app.use("/api/v1/internship", require("./routes/internshipRoute"));
app.use("/api/v1/report", require("./routes/reportRoute"));
app.use("/api/v1/chats", require("./routes/chatRoute"));
app.use("/api/v1/supervisions", require("./routes/scheduleRoute"));


// Create HTTP server
const server = http.createServer(app);
// Initialize WebSocket server
const wss = initializeWebSockets(server);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});