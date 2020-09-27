const isAuth = require("../middleware/isAuth");
const express = require("express");
const shopController = require("../controllers/shop");

const autoLogin = require("../middleware/autoLogin");
//........................................................................

const router = express.Router();

router.get("/", autoLogin, shopController.getIndex);

router.get("/products", autoLogin, shopController.getProducts);

router.get("/products/:productId", autoLogin, shopController.getProduct);

router.get("/cart", isAuth, shopController.getCart);

router.post("/cart/:productId", isAuth, shopController.postCart);

router.delete(
  "/cart-delete-item/:productId",
  isAuth,
  shopController.cartDeleteProduct
);

router.post("/create-order", isAuth, shopController.postOrder);

router.get("/orders", isAuth, shopController.getOrders);

router.delete("/delete-order/:orderId", isAuth, shopController.postDelteOrder);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
