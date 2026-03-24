const express = require("express");
const multer = require("multer");

const controller = require("../controllers/FilesController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/image", upload.single("file"), controller.uploadImage);
router.get("/cards/:game/:id", controller.getImage)

module.exports = router;
