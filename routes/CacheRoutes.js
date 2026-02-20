const express = require("express");
const router = express.Router();

router.get("/flush-all", controller.flushAll);

module.exports = router;
