const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { issue, getRecords } = require("../controllers/vaccination");

router.post("/issue", authMiddleware, issue);
router.get("/:wallet", getRecords);

module.exports = router;
