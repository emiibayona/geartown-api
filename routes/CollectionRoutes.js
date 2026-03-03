const express = require("express");
const multer = require("multer");

const controller = require("../controllers/CollectionController");

const router = express.Router();
const upload = multer(); // Use memory storage for small CSV files

router.post("/add", upload.single("file"), controller.initCollection);
router.get("/:collectionId", controller.cardsByCollection);
router.get("/user/:user", controller.cardsByUser);
router.patch("/:collectionId/singles", controller.updateCardsSingles);
router.patch("/:collectionId", controller.updateCards);
// Binders
router.get("/:collectionId/binders", controller.getBinders);
router.post("/:collectionId/binders", controller.createBinder);
// Cache
router.post("/flush-cache", controller.flushCache);
module.exports = router;
