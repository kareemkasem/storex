//imports..............................................................
const express = require("express");
const adminController = require("../controllers/admin");
const { body } = require("express-validator");
//......................................................................

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", adminController.getAddProduct);

// /admin/products => GET
router.get("/products", adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [body("title").trim(), body("description").trim()],
  adminController.postAddProduct
);

router.get("/edit-product/:productId", adminController.getEditProduct);

router.post(
  "/edit-product",
  [body("title").trim(), body("description").trim()],
  adminController.postEditProduct
);

router.delete("/product/:productId", adminController.deleteProduct);

module.exports = router;
