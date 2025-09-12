const express = require("express");
const app = express();
const path = require("path");
const { Todo } = require("./models");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Home route
app.get("/", async (req, res) => {
  const todos = await Todo.findAll({ order: [["dueDate", "ASC"]] });

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const overdueTodos = todos.filter(
    (todo) => todo.dueDate < today && !todo.completed
  );
  const dueTodayTodos = todos.filter((todo) => todo.dueDate === today);
  const dueLaterTodos = todos.filter((todo) => todo.dueDate > today);

  res.render("index", {
    overdueTodos,
    dueTodayTodos,
    dueLaterTodos,
  });
});

// Add new todo
app.post("/todos", async (req, res) => {
  try {
    await Todo.create({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false,
    });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating todo");
  }
});

// Mark as completed
app.get("/todos/:id/complete", async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (todo) {
      todo.completed = true;
      await todo.save();
    }
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error marking todo complete");
  }
});

// 🔄 Toggle completion (complete <-> undo)
app.get("/todos/:id/toggle", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  if (todo) {
    todo.completed = !todo.completed; // flip status
    await todo.save();
  }
  res.redirect("/");
});


// Delete todo
app.get("/todos/:id/delete", async (req, res) => {
  try {
    await Todo.destroy({ where: { id: req.params.id } });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting todo");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
