const { setSupervisionDates, deleteSupervisionDate, getSupervisionDates, updateDateRange } = require("../controllers/supervisionDatesRange");

const router = require("express").Router();

router.get("/",  getSupervisionDates);
router.put("/", setSupervisionDates);
router.put("/:dateId", updateDateRange);
router.delete("/", deleteSupervisionDate);

module.exports = router;