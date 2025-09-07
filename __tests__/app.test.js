const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const { Todo } = require("../models");
const app = express();

app.use(bodyParser.json());


app.get("/todos", async (req, res) => {
    try {
        const todos = await Todo.findAll();
        return res.json(todos);
    } catch (error) {
        return res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/todos", async (req, res) => {
    try {
        const todo = await Todo.addTodo({
            title: req.body.title,
            dueDate: req.body.dueDate
        });
        return res.json(todo);
    } catch (error) {
        return res.status(422).json(error);
    }
});

app.put("/todos/:id/markAsCompleted", async (req, res) => {
    try {
        const todo = await Todo.findByPk(req.params.id);
        if (!todo) return res.status(404).json({ error: "Todo not found" });
        const updatedTodo = await todo.markAsCompleted();
        return res.json(updatedTodo);
    } catch (error) {
        return res.status(422).json(error);
    }
});

app.delete("/todos/:id", async (req, res) => {
    try {
        const deleted = await Todo.destroy({ where: { id: req.params.id } });
        return res.json(deleted > 0);
    } catch (error) {
        return res.status(500).json({ error: "Something went wrong" });
    }
});

describe("Todo API Endpoints", () => {
    let todo;


    beforeAll(async () => {
        await Todo.sync({ force: true });
    });

    beforeEach(async () => {
        todo = await Todo.addTodo({
            title: "Test Todo",
            dueDate: "2025-09-07"
        });
    });

    afterEach(async () => {
        await Todo.destroy({ where: {} });
    });

    it("GET /todos should return all todos", async () => {
        const res = await request(app).get("/todos");
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty("title", "Test Todo");
    });

    it("POST /todos should create a new todo", async () => {
        const res = await request(app)
            .post("/todos")
            .send({ title: "New Todo", dueDate: "2025-09-08" });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("title", "New Todo");
        expect(res.body).toHaveProperty("completed", false);
    });

    it("PUT /todos/:id/markAsCompleted should mark todo as completed", async () => {
        const res = await request(app).put(`/todos/${todo.id}/markAsCompleted`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("completed", true);

        const updatedTodo = await Todo.findByPk(todo.id);
        expect(updatedTodo.completed).toBe(true);
    });

    it("DELETE /todos/:id should delete a todo and return true", async () => {
        const res = await request(app).delete(`/todos/${todo.id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBe(true);

        const deletedTodo = await Todo.findByPk(todo.id);
        expect(deletedTodo).toBeNull();
    });

    it("DELETE /todos/:id should return false if todo does not exist", async () => {
        const res = await request(app).delete("/todos/999999");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBe(false);
    });
});
