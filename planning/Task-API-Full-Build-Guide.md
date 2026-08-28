# Task CRUD API — Complete Build Guide
### From "Hello World" to a Full-Stack App with React, Swagger Docs, and GitHub

This guide merges all your tutorial checkpoints into one clean, ordered walkthrough. Each stage supports **two lanes** — pick one and stick with it:
- 🟢 **Node.js (Express)** — runs on port `3000`
- 🟠 **Python (FastAPI)** — runs on port `8000`

---

## Stage 0 — Hello, Server

Get a minimal server running

### 🟢 Node.js (Express)
1. `npm init -y`
2. `npm install express`
3. Create `server.js`:

```javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

4. Run: `node server.js`
5. Verify: `curl -i http://localhost:3000/`

### 🟠 Python (FastAPI)
Set up `main.py` with a basic FastAPI app (see Stage 1 for the first real code — this stage is just about getting `uvicorn` installed and running).

---

## Stage 1 — Root & Health Endpoints

Add a root endpoint describing the API, plus a `/health` check.

### 🟢 Node.js
```javascript
const express = require('express');
const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 🟠 Python (FastAPI)
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "name": "Task API",
        "version": "1.0",
        "endpoints": ["/tasks"]
    }

@app.get("/health")
def read_health():
    return {"status": "ok"}
```

**✅ Checkpoint**
```bash
curl -i http://localhost:3000/         # or 8000 for FastAPI
curl -i http://localhost:3000/health
```

**💾 Git commit**
```bash
git add .
git commit -m "Stage 1: root and health endpoints"
```

---

## Stage 2 — Read Endpoints (List + Single Task)

Add an in-memory mock database and two read endpoints: `GET /tasks` and `GET /tasks/:id` (with a 404 if not found).

### 🟢 Node.js
```javascript
const express = require('express');
const app = express();
const PORT = 3000;

let tasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
  { id: 3, title: "Study API design", done: false }
];

app.get('/', (req, res) => {
  res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 🟠 Python (FastAPI)
```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

tasks = [
    {"id": 1, "title": "Buy groceries", "done": False},
    {"id": 2, "title": "Clean the room", "done": True},
    {"id": 3, "title": "Study API design", "done": False}
]

@app.get("/")
def read_root():
    return {"name": "Task API", "version": "1.0", "endpoints": ["/tasks"]}

@app.get("/health")
def read_health():
    return {"status": "ok"}

# GET /tasks - Return all tasks
@app.get("/tasks")
def read_tasks():
    return tasks

# GET /tasks/{id} - Return a single task or 404
@app.get("/tasks/{id}")
def read_task(id: int):
    task = next((t for t in tasks if t["id"] == id), None)
    if task is None:
        raise HTTPException(status_code=404, detail={"error": f"Task {id} not found"})
    return task
```

**✅ Checkpoint**
```bash
curl -i http://localhost:3000/tasks     # (or 8000)
curl -i http://localhost:3000/tasks/1
curl -i http://localhost:3000/tasks/99  # expect 404
```

**💾 Git commit**
```bash
git add .
git commit -m "Stage 2: read endpoints with 404"
```

---

## Stage 3 — Create a Task (POST)

Handle request bodies and validate input before adding a new task.

### 🟢 Node.js (Express)
Requires the JSON body-parsing middleware: `app.use(express.json());`

```javascript
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
```

### 🟠 Python (FastAPI)
FastAPI validates automatically using a Pydantic model:

```python
from pydantic import BaseModel, Field

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)

@app.post("/tasks", status_code=201)
def create_task(task_input: TaskCreate):
    next_id = max((t["id"] for t in tasks), default=0) + 1
    new_task = {"id": next_id, "title": task_input.title, "done": False}
    tasks.append(new_task)
    return new_task
```

**✅ Checkpoint**
```bash
# Create valid task (expect 201 + new object with id: 4)
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'

# Test validation error (expect 400)
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{}'

# Verify list growth
curl http://localhost:3000/tasks
```
*(Swap port `3000` → `8000` for Python)*

**💾 Git commit**
```bash
git add .
git commit -m "Stage 3: POST /tasks with validation"
```

---

## Stage 4 — Update & Delete (PUT / DELETE)

Complete the CRUD set with update and delete logic based on path ID.

### 🟢 Node.js (Express)
```javascript
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
```

### 🟠 Python (FastAPI)
```python
from fastapi import status, Response
from typing import Optional

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    done: Optional[bool] = None

@app.put("/tasks/{id}")
def update_task(id: int, task_input: TaskUpdate):
    task = next((t for t in tasks if t["id"] == id), None)
    if task is None:
        raise HTTPException(status_code=404, detail={"error": f"Task {id} not found"})

    if task_input.title is not None:
        if not task_input.title.strip():
            raise HTTPException(status_code=400, detail={"error": "Title cannot be empty string"})
        task["title"] = task_input.title

    if task_input.done is not None:
        task["done"] = task_input.done

    return task

@app.delete("/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(id: int):
    global tasks
    task = next((t for t in tasks if t["id"] == id), None)
    if task is None:
        raise HTTPException(status_code=404, detail={"error": f"Task {id} not found"})
    tasks = [t for t in tasks if t["id"] != id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

**✅ Checkpoint**
```bash
# 1. Create
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Test Task"}'   # expect 201

# 2. Update
curl -i -X PUT http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"title":"Updated Title","done":true}'   # expect 200

# 3. Delete
curl -i -X DELETE http://localhost:3000/tasks/4   # expect 204, no body

# 4. Verify missing
curl -i http://localhost:3000/tasks/4   # expect 404
```

**💾 Git commit**
```bash
git add .
git commit -m "Stage 4: full CRUD (update + delete)"
```

---

## Stage 5 — Bonus Features: Filtering, Stats & Reset

Add query filtering (`?done=` / `?search=`) and note the limits of in-memory storage.

### 🟢 Node.js
```javascript
const initialTasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
  { id: 3, title: "Study API design", done: false }
];
let tasks = [...initialTasks];

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
```

### 🟠 Python (FastAPI)
```python
from fastapi import Query
from typing import Optional

@app.get("/tasks")
def read_tasks(done: Optional[bool] = None, search: Optional[str] = Query(None)):
    filtered = tasks
    if done is not None:
        filtered = [t for t in filtered if t["done"] == done]
    if search:
        filtered = [t for t in filtered if search.lower() in t["title"].lower()]
    return filtered

@app.get("/stats")
def read_stats():
    return {
        "total": len(tasks),
        "done": sum(1 for t in tasks if t["done"]),
        "open": sum(1 for t in tasks if not t["done"])
    }
```

**✅ Checkpoint**
```bash
curl -i http://localhost:3000/stats
curl -i "http://localhost:3000/tasks?search=room"
curl -i "http://localhost:3000/tasks?done=false"
curl -i -X POST http://localhost:3000/reset
```

**📌 Note on in-memory storage:** Restarting the server wipes any tasks created after boot — only the seeded defaults survive. Document this in your README as a known limitation (persistent storage, e.g. a database, is the next natural upgrade).

**💾 Git commit**
```bash
git add .
git commit -m "Stage 5: filtering, stats, and reset endpoint"
```

---

## Stage 6 — Interactive Docs (Swagger UI)

### 🟢 Node.js (Express)
Add near the top of `server.js` (after `app.use(express.json());`):
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

// Serve interactive Swagger UI documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

### 🟠 Python (FastAPI)
FastAPI generates docs automatically at `http://localhost:8000/docs`. Add clean summaries via the app title and route decorators:
```python
app = FastAPI(title="Task API", version="1.0")

@app.delete("/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a task")
def delete_task(id: int):
    ...
```

**✅ Checkpoint**
1. Open `http://localhost:3000/docs` (Express) or `http://localhost:8000/docs` (FastAPI).
2. Confirm all endpoints appear with clear summaries.
3. Use **Try it out** to fire live requests from the browser.

**💾 Git commit**
```bash
git add .
git commit -m "Stage 6: Swagger UI"
```

---

## Stage 7 — Repository Setup & Publish to GitHub

### 1. Create `.gitignore`
🟢 **Node.js:**
```text
node_modules/
.env
```
🟠 **Python:**
```text
__pycache__/
.pytest_cache/
.env
venv/
env/
```


