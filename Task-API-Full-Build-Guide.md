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

### 2. Create `README.md`
```markdown
# Task Management API

A lightweight, high-performance CRUD REST API built as a professional foundation for task management.

## 🚀 How to Install & Run

### Prerequisites
Node.js (v18+) or Python (v3.9+)

### One-Command Start
# For Node.js (Express) Lane:
npm install && node server.js

# For Python (FastAPI) Lane:
pip install fastapi uvicorn pydantic && uvicorn main:app --reload --port 8000

Interactive docs: http://localhost:3000/docs (or 8000 for FastAPI)

## 🗺 API Endpoint Reference
| Method | Endpoint | Description | Success Code | Error Codes |
|---|---|---|---|---|
| GET | / | API name, version, metadata | 200 OK | None |
| GET | /health | Server availability check | 200 OK | None |
| GET | /tasks | Retrieve all tasks | 200 OK | None |
| GET | /tasks/:id | Fetch a single task | 200 OK | 404 |
| POST | /tasks | Create a new task | 201 Created | 400 |
| PUT | /tasks/:id | Update title/done | 200 OK | 400, 404 |
| DELETE | /tasks/:id | Delete a task | 204 No Content | 404 |
```

### 3. Push to GitHub
```bash
git add .
git commit -m "Docs: add README and .gitignore"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

---

## Stage 8 — Connect a React Frontend

### The Architecture

```
React UI (TaskList, TaskForm, TaskStats)
        ↓ triggers actions
State Management (useState / useReducer)
        ↓ reads/writes state
API Service Layer (fetch wrapper)
        ↓ HTTP requests (JSON)
Task Backend API (Express 3000 / FastAPI 8000)
```

### Phase-by-phase plan
1. **CORS Gateway** — the backend must explicitly allow the React app's origin.
2. **API Infrastructure Layer** — isolate all network calls in `src/services/api.js` (never hardcode fetch calls inside UI components).
3. **State Setup** — track three states: `tasks`, `isLoading`, `error`.
4. **Component Construction** — `TaskStats`, `TaskList`, `TaskItem`, `TaskForm`, each single-responsibility.
5. **Error Defending & Optimistic Updates** — validate on the frontend before hitting the network; optionally update the UI instantly and roll back on failure.

**💾 Git branch strategy** — don't commit directly to `main`:
```bash
git checkout -b feature/react-api-integration
```

### Step 1 — Fix CORS on the Backend

🟢 **Node.js (Express):**
```bash
npm install cors
```
```javascript
const cors = require('cors');
app.use(cors()); // Allows all origins to connect
```
Restart: `node server.js`

🟠 **Python (FastAPI):**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Restart: `uvicorn main:app --reload --port 8000`

### Step 2 — Create the React Project
```bash
npm create vite@latest task-frontend -- --template react
cd task-frontend
npm install
npm run dev
```
Keep this terminal open — it serves the app at `http://localhost:5173`.

### Step 3 — Write the API Service Layer
Create `src/services/api.js`:
```javascript
// CHANGE THIS TO 8000 IF YOU ARE USING FASTAPI
const API_BASE_URL = "http://localhost:3000";

export const apiService = {
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  async getTasks() {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  async createTask(title) {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to create task");
    }
    return res.json();
  },

  async toggleTaskStatus(id, currentStatus) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !currentStatus })
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete task");
    return true; // 204 No Content has no JSON body
  }
};
```

### Step 4 — Build `src/App.jsx`
Use `apiService` to load stats/tasks on mount, and wire up handlers for create, toggle, and delete — each wrapped in `try/catch` so `error` state and an alert surface any network failure. Track `tasks`, `stats`, `isLoading`, `errorMessage`, and `newTitle` (the form input) with `useState`, and call your load function inside `useEffect` on mount.

### Step 5 — Commit
```bash
git add .
git commit -m "Integration: React app connected to full CRUD backend API"
```

---

## Full Journey Recap

| Stage | What you built |
|---|---|
| 0 | Bare "Hello World" server |
| 1 | Root `/` + `/health` endpoints |
| 2 | `GET /tasks`, `GET /tasks/:id` with 404 handling |
| 3 | `POST /tasks` with validation |
| 4 | `PUT /tasks/:id`, `DELETE /tasks/:id` — full CRUD |
| 5 | Query filtering, `/stats`, `/reset`, README notes on in-memory limits |
| 6 | Swagger UI interactive docs |
| 7 | `.gitignore`, `README.md`, pushed to GitHub |
| 8 | React frontend wired to the API via a service layer |

You now have a complete, documented, version-controlled full-stack Task CRUD application.
