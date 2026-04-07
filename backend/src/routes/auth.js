const router = require("express").Router();
const { challenge, verify } = require("../controllers/auth");

router.post("/sep10", challenge);
router.post("/verify", verify);

module.exports = router;
