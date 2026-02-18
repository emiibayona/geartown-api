const express = require("express");
const router = express.Router();

const cardRoutes = require("./CardRoutes");
const collectionRoutes = require("./CollectionRoutes");
const userRoutes = require("./UserRoutes");
const syncRoutes = require("./SyncRoutes");
const infoRoutes = require("./InfoRoutes");
const productsRoutes = require("./ProductsRoutes");

router.use("/cards", cardRoutes);
router.use("/collections", collectionRoutes);
router.use("/users", userRoutes);
router.use("/sync", syncRoutes);
router.use("/info", infoRoutes);
router.use("/products", productsRoutes);

router.get("/", (req, res) => {
  res.json("HOLA");
});

module.exports = router;
