// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const path = require("path");

const { Todo } = require("./models");
const sequelize = require("./sequelize");

const app = express();

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

// parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// CSRF protection enabled for normal env; disabled in tests
if (process.env.NODE_ENV !== "test") {
  const csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);
  // expose token to all views
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
} else {
  // in test env, provide dummy token for views to render if needed
  app.use((req, res, next) => {
    res.locals.csrfToken = "";
    next();
  });
}

// helpers
const todayISO = () => new Date().toISOString().split("T")[0];

// ROUTES

// home — categorized view
app.get("/", async (req, res) => {
  const todos = await Todo.findAll({ order: [["dueDate", "ASC"]] });
  const today = todayISO();

  const overdueTodos = todos.filter(
    (t) => t.dueDate && t.dueDate < today && !t.completed
  );
  const dueTodayTodos = todos.filter(
    (t) => t.dueDate && t.dueDate === today && !t.completed
  );
  const dueLaterTodos = todos.filter(
    (t) => t.dueDate && t.dueDate > today && !t.completed
  );
  const completedTodos = todos.filter((t) => t.completed);

  res.render("index", {
    overdueTodos,
    dueTodayTodos,
    dueLaterTodos,
    completedTodos,
  });
});

// API: Create todo
app.post("/todos", async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    // server-side validation (also add client-side)
    if (!title || title.trim() === "" || !dueDate) {
      // if request from browser form -> redirect with 400 message? keep simple
      return res.status(400).send("title and dueDate required");
    }
    await Todo.addTodo({ title: title.trim(), dueDate });
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error creating todo");
  }
});

// API: Update todo (PUT /todos/:id) - set completion status or change fields
app.put("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo) return res.status(404).json({ error: "Not found" });

    // only update fields we allow (completed, title, dueDate)
    if (typeof req.body.completed !== "undefined") {
      await todo.setCompletionStatus(!!req.body.completed);
    }
    if (typeof req.body.title !== "undefined") {
      todo.title = req.body.title;
    }
    if (typeof req.body.dueDate !== "undefined") {
      todo.dueDate = req.body.dueDate || null;
    }
    await todo.save();
    return res.json(todo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update" });
  }
});

// API: Delete todo (DELETE /todos/:id)
app.delete("/todos/:id", async (req, res) => {
  try {
    const deleted = await Todo.destroy({ where: { id: req.params.id } });
    return res.json({ deleted: deleted > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete" });
  }
});

// For forms (browser actions) without method override: support POST endpoints that redirect
// mark complete/uncomplete via POST endpoint for forms
app.post("/todos/:id/set-completion", async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (todo) {
      const completed = req.body.completed === "true" || req.body.completed === true;
      await todo.setCompletionStatus(completed);
    }
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error toggling completion");
  }
});

// delete via form-post
app.post("/todos/:id/delete", async (req, res) => {
  try {
    await Todo.destroy({ where: { id: req.params.id } });
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error deleting");
  }
});

// error handler for CSRF
app.use((err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Form tampered with");
  }
  return next(err);
});

module.exports = app;
