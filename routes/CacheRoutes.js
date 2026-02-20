const express = require("express");
const router = express.Router();
const controller = require("../controllers/CacheController");

router.post("/flush/all", controller.flushAll);

module.exports = router;
