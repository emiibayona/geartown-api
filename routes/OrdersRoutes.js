const express = require("express");
const router = express.Router();
const controller = require("../controllers/OrdersController");

// router.get("/sets", controller.getSets);
// router.get("/sets/:id", controller.getSetByid);
// router.get("/sets/code/:code", controller.getSetsByCode);

router.get("/:game/", controller.getOrders);
router.get("/:game/:orderId", controller.getOrderById);
router.post("/:game/", controller.createOrder);
router.patch("/:game/:orderId", controller.updateOrder);
module.exports = router;
