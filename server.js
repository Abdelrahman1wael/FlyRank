const express = require('express');
const app = express();
const PORT = 3000;
// Middleware to parse JSON request bodies
app.use(express.json());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

// Serve interactive Swagger UI documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

let tasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
  { id: 3, title: "Study API design", done: false }
];

const initialTasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
  { id: 3, title: "Study API design", done: false }
];
let tasks = [...initialTasks];

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

// GET /tasks - Supports ?done=true/false and ?search=word
app.get('/tasks', (req, res) => {
  let filteredTasks = [...tasks];
  const { done, search } = req.query;

  if (done !== undefined) {
    filteredTasks = filteredTasks.filter(t => t.done === (done === "true"));
  }
  if (search) {
    filteredTasks = filteredTasks.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  res.json(filteredTasks);
});

// GET /stats
app.get('/stats', (req, res) => {
  res.json({
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    open: tasks.filter(t => !t.done).length
  });
});

// POST /reset - restore seed data
app.post('/reset', (req, res) => {
  tasks = [...initialTasks];
  res.json({ message: "Tasks reset to initial seed data", tasks });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});