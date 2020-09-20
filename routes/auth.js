const express = require("express");
const authController = require("../controllers/auth");
const { check } = require("express-validator");
//...................................................................

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/login", authController.postLogin);

router.post(
  "/signup",
  check("email")
    .isEmail()
    .withMessage("Invalid Email")
    .custom((input) => {
      if (input === "kareemkasem@outlook.com") {
        throw new Error("Admin email address is forbidden");
      } else {
        return true;
      }
    }),
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getResetPassword);

router.post("/reset", authController.postResetPassword);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
