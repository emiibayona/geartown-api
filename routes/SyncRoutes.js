const express = require("express");
const router = express.Router();
const controller = require("../controllers/SyncController");

router.post("/magic/cards", controller.syncCards);
router.post("/magic/sets", controller.syncSets);

router.post("/yugioh/cards", controller.syncYugiohCards)
router.post("/yugioh/sets", controller.syncYugiohSets)
router.post("/yugioh/archetypes", controller.syncYugiohArchetypes)

module.exports = router;
