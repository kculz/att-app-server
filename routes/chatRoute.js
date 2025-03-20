const router = require("express").Router();
const { createChat, getChat } = require("../controllers/chat");

const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Create a new chat for a supervision relationship
router.post('/', createChat);
router.get("/:id", getChat);



module.exports = router;