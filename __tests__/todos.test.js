// __tests__/todos.test.js
const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../models");
const { Todo } = require("../models");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Todo endpoints", () => {
  test("POST /todos creates a todo", async () => {
    const res = await request(app)
      .post("/todos")
      .send("title=Test+task&dueDate=2099-12-31")
      .set("Content-Type", "application/x-www-form-urlencoded");

    expect(res.statusCode).toBe(302); // redirect to /
    const todos = await Todo.findAll();
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe("Test task");
  });

  test("PUT /todos/:id updates completed status", async () => {
    const todo = await Todo.create({ title: "To toggle", dueDate: "2099-12-31", completed: false });

    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ completed: true })
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(200);
    const updated = await Todo.findByPk(todo.id);
    expect(updated.completed).toBe(true);
  });

  test("DELETE /todos/:id deletes a todo", async () => {
    const todo = await Todo.create({ title: "To delete", dueDate: "2099-12-31", completed: false });

    const res = await request(app).delete(`/todos/${todo.id}`);
    expect(res.statusCode).toBe(200);
    const deleted = await Todo.findByPk(todo.id);
    expect(deleted).toBeNull();
  });
});
