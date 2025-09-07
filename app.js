const {request,response} = require('express')
const express = require('express')
const app = express()
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const {Todo} = require("./models")

app.get("/todos", async (request, response) => {
    try {
        // Fetch all todos from the database
        const todos = await Todo.findAll();
        // Send the todos as JSON response
        return response.json(todos);
    } catch (error) {
        console.log(error);
        return response.status(500).json({ error: "Something went wrong while fetching todos" });
    }
});



app.post("/todos", async (request, response)=>{
    console.log("Creating a todo", request.body)

    try{
        const todo = await Todo.addTodo({ title: request.body.title, dueDate: request.body.dueDate, completed: false})
        return response.json(todo)
    }catch{
        console.log(error)
        return response.status(422).json(error)
    }
   
})

app.put("/todos/:id/markAsCompleted", async (request, response) =>{
    console.log("We have to update a todo with ID:", request.params.id)
    const todo = await Todo.findByPk(request.params.id)
    try {
        const updatedTodo = await todo.markAsCompleted()
        return response.json(updatedTodo)
    } catch(error) {
        console.log(error)
        return response.status(422).json(error)
    }
})

app.delete("/todos/:id", async (request, response) => {
    try {
        const deleted = await Todo.destroy({
            where: { id: request.params.id }
        });
        // If deleted > 0, deletion was successful
        return response.json(deleted > 0);
    } catch (error) {
        console.log(error);
        return response.status(500).json({ error: "Something went wrong while deleting todo" });
    }
});



app.listen(3000, ()=>{
    console.log("started express server at port 3000")
})