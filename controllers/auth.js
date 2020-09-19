//imports ........................................................
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

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
  const { email, password, confirmPassword } = req.body;

  const createUser = (email, password) => {
    return bcrypt.hash(password, 12).then((hashedPass) => {
      const newUser = new User({ email, password: hashedPass });
      return newUser.save();
    });
  };

  User.findOne({ email }).then((userDoc) => {
    if (userDoc) {
      req.flash("error", "user already exist");
      return res.redirect("/signup");
    } else if (password !== confirmPassword) {
      req.flash("error", "passwords don't match");
      return res.redirect("/signup");
    } else {
      createUser(email, password)
        .then(() => {
          return transporter.sendMail({
            to: email,
            from: "kareemkasem@outlook.com",
            subject: "sign up confirmation",
            html: "<h1>You successfully signed up to storeX</h1>",
          });
        })
        .then(() => res.redirect("/login"))
        .catch((err) => console.log(err));
    }
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
