//imports..........................................................................
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const isAuth = require("./middleware/isAuth");
const errorController = require("./controllers/error");
const User = require("./models/user");
//..................................................................................

//config
const MONGODB_URI =
  "mongodb+srv://kareem:Z2ERoOf2fT3lcqtO@store-tut.cns3t.azure.mongodb.net/store-tut?w=majority";
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// session
app.use(
  session({
    secret: "typescriptiscoolandall",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
const csrfProtection = csrf();
app.use(csrfProtection); //must be initialized after the session
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//init
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });

// routing
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use("/admin", isAuth, adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);
