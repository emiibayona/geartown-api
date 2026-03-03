const express = require("express");
const multer = require("multer");
const controller = require("../controllers/ProductController");

const router = express.Router();
const upload = multer(); // Use memory storage for small CSV files

router.get("/sealed/:type", controller.getProducts);
router.post("/sealed", upload.single("file"), controller.addProducts);
router.patch("/sealed/:id", controller.update);
router.delete("/sealed/:id/:type", controller.delete);
module.exports = router;
