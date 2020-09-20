//imports ........................................................
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const User = require("../models/user");
//................................................................

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash("error"),
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: req.flash("error"),
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email }).then((user) => {
    if (!user) {
      req.flash("error", `${email} is not found`);
      return res.redirect("/login");
    } else {
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) => {
              err && console.log(err);
              res.redirect("/");
            });
          } else {
            req.flash("error", "password is incorrect");
            res.redirect("/login");
          }
        })
        .catch((err) => console.log(err));
    }
  });
};

exports.postSignup = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status("422").render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPass) => {
      const newUser = new User({ email, password: hashedPass });
      return newUser.save();
    })
    .then(() => {
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: "kareemkasem@outlook.com",
        subject: "sign up confirmation",
        html: "<h1>You successfully signed up to storeX</h1>",
      });
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getResetPassword = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: req.flash("error"),
  });
};

exports.postResetPassword = (req, res, next) => {
  crypto.randomBytes(32, (err, buf) => {
    if (err) {
      console.log(err);
      req.flash("error", "an error occured");
      return res.redirect("/reset");
    } else {
      const token = buf.toString("hex");
      User.findOne({ email: req.body.email })
        .then((user) => {
          if (!user) {
            req.flash("error", "user not found");
            return res.redirect("/reset");
          } else {
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
          }
        })
        .then(() => {
          res.redirect("/");
          transporter.sendMail({
            to: req.body.email,
            from: "kareemkasem@outlook.com",
            subject: "password reset",
            html: `
            <h3>you requested a password reset</h3>
            <p> click <a href="http://localhost:3000/reset/${token}">here</a> to reset your password</p>
            <hr />
            <p>please note that this link is only valid for 1 hour</p>
            `,
          });
        })
        .catch((err) => {
          console.log(err);
          req.flash("error", "an error occured");
          return res.redirect("/reset");
        });
    }
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: req.flash("error"),
        userId: user._id.toString(),
        token,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "couldn't set password, try again");
      return res.redirect("/reset/" + token);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const token = req.body.token;
  const userId = req.body.userId;
  let resetUser;

  User.findOne({
    _id: userId,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPass) => {
      resetUser.password = hashedPass;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "couldn't set password, try again");
      return res.redirect("/reset/" + token);
    });
};
