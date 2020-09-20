const express = require("express");
const authController = require("../controllers/auth");
const { check, body } = require("express-validator");
const User = require("../models/user");
//...................................................................

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  body("email")
    .isEmail()
    .withMessage("please provide a valid email address")
    .normalizeEmail() /*sanitizer: https://github.com/validatorjs/validator.js */,
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email") // searches body, cookies, headers and everywhere
      .isEmail()
      .withMessage("Invalid Email")
      .custom((input) => {
        if (input === "kareemkasem@outlook.com") {
          throw new Error("Admin email address is forbidden");
        } else {
          return true;
        }
      })
      .normalizeEmail()
      .custom((input) => {
        /* 
          Async validation
          here the express-validator will wrap this function in an async/await function
          it will also handle the rejection as an error message automatically
        */
        return User.findOne({ email: input }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("User already Exists");
          }
        });
      }),
    body(
      // searches body only
      "password",
      "make sure the password is between 8 and 16 characters" // default error for all validators
    ).isLength({ min: 8, max: 16 }),
    body("confirmPassword").custom((input, { req }) => {
      if (input !== req.body.password) {
        throw new Error("passwords don't match");
      } else {
        return true;
      }
    }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getResetPassword);

router.post("/reset", authController.postResetPassword);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
