const express = require("express");
const router = express.Router();
const controller = require("../controllers/CacheController");

router.get("/flush-all", controller.flushAll);

module.exports = router;
