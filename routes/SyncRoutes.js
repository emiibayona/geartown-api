const express = require("express");
const router = express.Router();
const controller = require("../controllers/SyncController");

router.post("/cards", controller.syncCards);
router.post("/sets", controller.syncSets);


module.exports = router;
