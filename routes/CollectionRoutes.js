const express = require("express");
const multer = require("multer");

const controller = require("../controllers/CollectionController");

const router = express.Router();
const upload = multer(); // Use memory storage for small CSV files

// POST route to initialize a collection
// router.post("/init", upload.single("file"), (req, res) => {
//   try {
//     // Add your collection initialization logic here

//     res.status(201).json({
//       message: "Collection initialized successfully",
//       data: {},
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: "Failed to initialize collection",
//       message: error.message,
//     });
//   }
// });
router.post("/add", upload.single("file"), controller.initCollection);
router.get("/:collectionId", controller.cardsByCollection);
router.get("/user/:user", controller.cardsByUser);
router.post("/flush-cache", controller.flushCache);
router.patch("/:collectionId/singles", controller.updateCardsSingles);
router.patch("/:collectionId", controller.updateCards);

router.get("/:collectionId/binders", controller.getBinders);
router.post("/:collectionId/binders", controller.createBinder);
module.exports = router;
