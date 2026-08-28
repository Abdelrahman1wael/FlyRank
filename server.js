const express = require('express');
const app = express();
const PORT = 3000;
// Middleware to parse JSON request bodies
app.use(express.json());

let tasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
  { id: 3, title: "Study API design", done: false }
];

// Middleware to parse JSON request bodies
app.use(express.json());

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  // Validation: Check if title is missing or empty
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  // Generate next ID
  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id: nextId,
    title: title,
    done: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/', (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

// GET /tasks - Return all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET /tasks/:id - Return a single task or 404
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.json(task);
});

app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const { title, done } = req.body;
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Missing fields to update" });
  }
  if (title !== undefined && (!title || title.trim() === "")) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "'done' must be a boolean" });
  }

  if (title !== undefined) tasks[taskIndex].title = title;
  if (done !== undefined) tasks[taskIndex].done = done;
  res.json(tasks[taskIndex]);
});

app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send(); // 204 No Content has an empty body
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});