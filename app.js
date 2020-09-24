//imports..........................................................................
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const isAuth = require("./middleware/isAuth");
const flash = require("connect-flash");
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

// static serving
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
/*
/images is passes as a part of the url the request that the image is served from
BUT as stated by the express docs:
 "Express looks up the files relative to the static directory, so the name of the static directory is NOT part of the URL."
 which means the static server will try to load images on /imageName.png not /images/imageName.png
 and  that's why we added the "/images" to the middleware
*/

// parsers
app.use(bodyParser.urlencoded({ extended: false }));

const multerStorage = multer.diskStorage({
  destination: "./images",
  /* (req, file, cb) => {
    cb(null, "images");
  },*/
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const multerFileFilter = (req, file, cb) => {
  const mimetypes = ["image/png", "image/jpg", "image/jpeg"];
  if (mimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: multerStorage, fileFilter: multerFileFilter }).single(
    "image"
  )
);

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
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use(flash()); //must be initialized after the session

// this is step is made to make sure that the user have all the mongoose provided methods by tying the plain user in the session to a mongoose handled use in the request
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
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
const errorRoutes = require("./routes/errors");

app.use("/admin", isAuth, adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorRoutes);
app.use(errorController.get404);

//Erros middleware
app.use((error, req, res, next) => {
  res.redirect("/500");
});
