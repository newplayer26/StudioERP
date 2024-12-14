require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");

const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const path = require("path");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const db = require("./models");
const { User, Avatar } = require("./models");
const app = express();
const { isLoggedIn } = require("./utils/middlewares");
const authRoute = require("./routes/auth");
const hrRoutes = require("./routes/hrRoutes");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const apiRoutes = require("./routes/api");
const manageRoutes = require("./routes/manage");
const initAPIRoutes = require("./routes/API/index");
const SSE = require("express-sse");
const sse = new SSE();

const SequelizeStore = require("connect-session-sequelize")(session.Store);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          where: { email },
          include: {
            model: Avatar,
          },
        });
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        const hash = crypto
          .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
          .toString("hex");
        if (hash !== user.password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

app.use(flash());

const sessionConfig = {
  secret: "keyboardcat",
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: db.sequelize,
  }),
  cookie: {
    expires: Date.now() + 7 * 24 * 3600 * 1000,
    maxAge: 7 * 24 * 3600 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      include: { model: Avatar },
    });

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

app.use((req, res, next) => {
  res.locals.currentUrl = req.url;
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(
  cors({
    // origin: process.env.DOMAIN_NAME,
    origin: true,
    credentials: true,
  })
);
initAPIRoutes(app);

app.use(isLoggedIn);

app.get("/", (req, res) => {
  res.redirect("/projects");
});
app.get("/home", (req, res) => {
  res.redirect("/projects");
});
app.use("/", authRoute);

app.use("/search", apiRoutes);

app.use("/manage", manageRoutes);
app.use("/users", hrRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);

app.use((err, req, res, next) => {
  const { status = 500 } = err;
  if (!err.message) err.message = "Oops, something went wrong!";
  res.status(status).render("error", { err });
});

if (process.env.NODE_ENV == "development") {
  //db.sequelize.sync({ force: true }).then((req) => {
  //require("./seeders/seeds")();
  app.listen(process.env.PORT, () => {
    console.log(`Serving on ${process.env.PORT}`);
  });
  //});
} else if (process.env.NODE_ENV == "production") {
  //db.sequelize.sync().then((req) => {
  app.listen(process.env.PORT, () => {
    console.log(`Serving on ${process.env.PORT}`);
  });
  //});
}
