const User = require("../models/user");
const AuthedUser = require("../models/authed-user");

module.exports = (req, res, next) => {
  if (!req.session.user) {
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",").pop().trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    AuthedUser.findOne({ ip })
      .then((authedUser) => {
        if (!!authedUser) {
          User.findOne({ email: authedUser.email })
            .then((user) => {
              if (!user) {
                next();
              } else {
                if (authedUser.password == user.password) {
                  req.session.isLoggedIn = true;
                  req.session.user = user;
                  req.session.save((err) => {
                    err && console.log(err);
                  });
                  req.user = user;
                }
                next();
              }
            })
            .catch((err) => {
              err && console.log(err);
              next();
            });
        } else {
          err && console.log(err);
          next();
        }
      })
      .catch((err) => {
        err && console.log(err);
        next();
      });
  } else {
    next();
  }
};
