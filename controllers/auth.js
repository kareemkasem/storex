//imports ........................................................
const bcrypt = require("bcryptjs");

const User = require("../models/user");
//................................................................

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
  });
};

exports.postLogin = (req, res, next) => {
  User.findById("5f561e4d29ee29243e9eb153")
    .then((user) => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save((err) => {
        console.log(err);
        res.redirect("/");
      });
    })
    .catch((err) => console.log(err));
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
    if (userDoc || password !== confirmPassword) {
      return res.redirect("/signup");
    } else {
      createUser(email, password)
        .then(() => {
          res.redirect("/login");
        })
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
