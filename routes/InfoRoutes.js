const express = require("express");
const router = express.Router();
const controller = require("../controllers/InfoController");

router.get("/sets", controller.getSets);
router.get("/sets/:id", controller.getSetByid);
router.get("/sets/code/:code", controller.getSetsByCode);

module.exports = router;
