const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const { Todo, User } = require("./models");

const app = express();

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static files
app.use("/public", express.static(path.join(__dirname, "public")));

// parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// session
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);

// connect-flash
app.use(flash());

// passport setup
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection
const csrfProtection = csrf({ cookie: false });
app.use(csrfProtection);

// make csrfToken and flash messages available in all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.messages = req.flash();
  res.locals.user = req.user || null;
  next();
});

// Passport local strategy
passport.use(
  new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return done(null, false, { message: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return done(null, false, { message: "Invalid email or password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ---------------- ROUTES ----------------

// Home/dashboard
app.get("/", async (req, res) => {
  if (!req.user) return res.redirect("/login");

  try {
    const todos = await Todo.findAll({
      where: { userId: req.user.id },
      order: [["dueDate", "ASC"]],
    });

    const today = new Date().toISOString().split("T")[0];

    const overdueTodos = todos.filter((t) => t.dueDate && t.dueDate < today && !t.completed);
    const dueTodayTodos = todos.filter((t) => t.dueDate && t.dueDate === today && !t.completed);
    const dueLaterTodos = todos.filter((t) => t.dueDate && t.dueDate > today && !t.completed);
    const completedTodos = todos.filter((t) => t.completed);

    res.render("index", { overdueTodos, dueTodayTodos, dueLaterTodos, completedTodos });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading todos");
    res.render("index", { overdueTodos: [], dueTodayTodos: [], dueLaterTodos: [], completedTodos: [] });
  }
});

// Signup
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  try {
    const { first_name, email, password } = req.body;

    // Basic validation
    if (!first_name || !email || !password) {
      req.flash("error", "First name, email, and password are required");
      return res.redirect("/signup");
    }

    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      req.flash("error", "Email already exists");
      return res.redirect("/signup");
    }

    // Create user (validations will be handled by Sequelize)
    await User.create({ first_name, email, password });
    req.flash("success", "Signup successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    
    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      const errorMessages = err.errors.map(error => error.message);
      errorMessages.forEach(msg => req.flash("error", msg));
    } else if (err.name === "SequelizeUniqueConstraintError") {
      req.flash("error", "Email already exists");
    } else {
      req.flash("error", "Error creating user");
    }
    
    res.redirect("/signup");
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Logged in successfully");
    res.redirect("/");
  }
);

// Logout
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully");
    res.redirect("/login");
  });
});

// Add Todo
app.post("/todos", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const { title, dueDate } = req.body;
    
    // Basic validation
    if (!title || title.trim().length === 0) {
      req.flash("error", "Todo title cannot be empty");
      return res.redirect("/");
    }
    
    if (!dueDate) {
      req.flash("error", "Due date is required");
      return res.redirect("/");
    }

    // Create todo (Sequelize validations will handle detailed validation)
    await Todo.create({ 
      title: title.trim(), 
      dueDate, 
      userId: req.user.id 
    });
    req.flash("success", "Todo added successfully");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    
    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      const errorMessages = err.errors.map(error => error.message);
      errorMessages.forEach(msg => req.flash("error", msg));
    } else {
      req.flash("error", "Error creating todo");
    }
    
    res.redirect("/");
  }
});

// Toggle completion
app.post("/todos/:id/set-completion", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");
    
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (todo) {
      todo.completed = req.body.completed === "true";
      await todo.save();
      req.flash("success", "Todo updated");
    } else {
      req.flash("error", "Todo not found");
    }
    
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating todo");
    res.redirect("/");
  }
});

// Delete todo
app.post("/todos/:id/delete", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");
    
    const deletedCount = await Todo.destroy({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      } 
    });
    
    if (deletedCount > 0) {
      req.flash("success", "Todo deleted");
    } else {
      req.flash("error", "Todo not found");
    }
    
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error deleting todo");
    res.redirect("/");
  }
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Form tampered with");
  }
  next(err);
});

module.exports = app;