const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const { Todo } = require("./models");

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", async (req, res) => {
  const todos = await Todo.findAll({ order: [["dueDate", "ASC"]] });
  const today = new Date().toISOString().split("T")[0];

  const overdueTodos = todos.filter(todo => todo.dueDate < today && !todo.completed);
  const dueTodayTodos = todos.filter(todo => todo.dueDate === today);
  const dueLaterTodos = todos.filter(todo => todo.dueDate > today);

  res.render("index", { overdueTodos, dueTodayTodos, dueLaterTodos });
});

// Get all todos as JSON
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.findAll();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong while fetching todos" });
  }
});

// Add a todo
app.post("/todos", async (req, res) => {
  try {
    const todo = await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false
    });
    res.json(todo);
  } catch (error) {
    res.status(422).json(error);
  }
});

// Mark todo as completed
app.put("/todos/:id/markAsCompleted", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    res.json(updatedTodo);
  } catch (error) {
    res.status(422).json(error);
  }
});

// Delete a todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const deleted = await Todo.destroy({ where: { id: req.params.id } });
    res.json(deleted > 0);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong while deleting todo" });
  }
});

app.listen(3000, () => {
  console.log("Express server started on port 3000");
});
