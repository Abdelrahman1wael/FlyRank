# Full-Stack Task API: From In-Memory Array to Real Postgres Database

This guide merges all the lesson fragments into one clean, ordered walkthrough. Each stage builds on the last — pick either the **Node.js (Express)** lane or the **Python (FastAPI)** lane and stick with it throughout.

---

## Stage 0: Fix the Starter Code

Before adding a real database, the starter Task API (using a plain in-memory array) has two bugs to fix.

### The Bugs
- **Array Filter Bug:** Inside `app.get('/tasks')`, the filter method `filteredTasks.filter(...)` does not mutate the array in place. Because its result is never reassigned back to `filteredTasks`, the `?done=` query parameter is silently ignored.
- **Missing Seed Array Bracket:** The `initialTasks` seed data array is missing its closing bracket, leaving a stray object outside the array — a syntax error.

```javascript
// BROKEN
const initialTasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
]; // <-- Array mistakenly closed early here
  { id: 3, title: "Study API design", done: false } // <-- Syntax error (isolated object)
```

### Fixed Node.js (`server.js`)

```javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// FIXED: Corrected array nesting brackets
const initialTasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Clean the room", done: true },
  { id: 3, title: "Study API design", done: false }
];

// In-memory runtime database array
let tasks = [...initialTasks];

app.get('/', (req, res) => {
  res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks", "/stats"] });
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

// GET /tasks — Supports ?done=true/false and ?search=word parameters
app.get('/tasks', (req, res) => {
  let filteredTasks = [...tasks];
  const { done, search } = req.query;

  if (done !== undefined) {
    const isDone = done === 'true';
    // FIXED: Now properly reassigning the filtered array result
    filteredTasks = filteredTasks.filter(t => t.done === isDone);
  }

  if (search !== undefined && search.trim() !== "") {
    filteredTasks = filteredTasks.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json(filteredTasks);
});

// GET /stats — Calculates summary information
app.get('/stats', (req, res) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const open = total - done;
  res.json({ total, done, open });
});

// POST /reset — Re-seeds initial values
app.post('/reset', (req, res) => {
  tasks = [...initialTasks];
  res.json({ message: "Database reset to initial seed values", count: tasks.length });
});

// Standard CRUD endpoints below
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: `Task ${taskId} not found` });
  res.json(task);
});

app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === "") return res.status(400).json({ error: "Title is required" });
  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  const newTask = { id: nextId, title, done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: `Task ${taskId} not found` });

  const { title, done } = req.body;
  if (title === undefined && done === undefined) return res.status(400).json({ error: "Missing fields to update" });
  if (title !== undefined && (!title || title.trim() === "")) return res.status(400).json({ error: "Title cannot be empty" });
  if (done !== undefined && typeof done !== "boolean") return res.status(400).json({ error: "done must be boolean" });

  if (title !== undefined) tasks[taskIndex].title = title;
  if (done !== undefined) tasks[taskIndex].done = done;
  res.json(tasks[taskIndex]);
});

app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: `Task ${taskId} not found` });
  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
```

---

## Stage 1: Connect Your App to a Real Postgres Database

Set up a repository module (Stage 1) that keeps all database logic encapsulated in one place, separate from your routes.

### 1. Create Your Environment Files

`.env` (add this to `.gitignore` so it's never tracked by Git):
```ini
DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
```

`.env.example` (safe to commit):
```ini
DATABASE_URL=postgres://username:password@localhost:5432/database_name
```

### 2. Node.js Lane (Express with `pg`)

```bash
npm install pg dotenv
```

Create `db.js`:
```javascript
// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    // 1. Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE
      );
    `);

    // 2. Count existing records
    const res = await client.query('SELECT COUNT(*) FROM tasks;');
    const count = parseInt(res.rows[0].count, 10);

    // 3. Seed initial 3 values only if empty
    if (count === 0) {
      const seedQuery = `
        INSERT INTO tasks (title, done) VALUES
        ('Buy groceries', false),
        ('Clean the room', true),
        ('Study API design', false);
      `;
      await client.query(seedQuery);
      console.log('Database initialized and seeded.');
    } else {
      console.log('Database already exists with data. Skipping seed.');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
};

// Initialize connection immediately on module load
initDb();

module.exports = pool;
```

### 3. Python Lane (FastAPI with `psycopg`)

```bash
pip install "psycopg[binary]" python-dotenv
```

Create `database.py`:
```python
# database.py
import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    # Returns a connection that maps columns to dictionary structures
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

def init_db():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Create table if it doesn't exist
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS tasks (
                        id SERIAL PRIMARY KEY,
                        title TEXT NOT NULL,
                        done BOOLEAN DEFAULT FALSE
                    );
                """)

                # 2. Check if table is empty
                cur.execute("SELECT COUNT(*) FROM tasks;")
                count = cur.fetchone()["count"]

                # 3. Seed initial 3 values if empty
                if count == 0:
                    cur.execute("""
                        INSERT INTO tasks (title, done) VALUES
                        ('Buy groceries', false),
                        ('Clean the room', true),
                        ('Study API design', false);
                    """)
                    conn.commit()
                    print("Database initialized and seeded successfully.")
                else:
                    print("Database already contains records. Skipping seed.")
    except Exception as e:
        print(f"Error connecting or initializing the database: {e}")
        raise e

# Run initialization upon module lookup
init_db()
```

### Verification Checkpoint

```bash
# Check that the table was created successfully
docker exec -it taskdb psql -U postgres -d tasks -c "\dt"

# Check that exactly 3 rows are inside the database
docker exec -it taskdb psql -U postgres -d tasks -c "SELECT * FROM tasks;"
```

---

## Stage 2: Read from Postgres

Update your routes to pull data directly from Postgres instead of the temporary in-memory array.

### Node.js Lane (Express)

```javascript
const express = require('express');
const pool = require('./db'); // Import the Postgres connection pool
const app = express();
const PORT = 3000;

app.use(express.json());

// GET /tasks - Reads straight from Postgres
app.get('/tasks', async (req, res) => {
  try {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    const { done, search } = req.query;

    if (done !== undefined) {
      params.push(done === 'true');
      sql += ` AND done = $${params.length}`;
    }

    if (search !== undefined && search.trim() !== "") {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND LOWER(title) LIKE $${params.length}`;
    }

    sql += ' ORDER BY id ASC;';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks/:id - Reads a single item securely via placeholders
app.get('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID format" });
  }

  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1;', [taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Task ${taskId} not found` });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// (Keep remaining placeholder endpoints below until we update them in subsequent steps)
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
```

### Python Lane (FastAPI)

```python
from fastapi import FastAPI, HTTPException, status
from typing import Optional, List
from database import get_db_connection

app = FastAPI()

# GET /tasks - Reads straight from Postgres
@app.get("/tasks")
def read_tasks(done: Optional[bool] = None, search: Optional[str] = None):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                sql = "SELECT * FROM tasks WHERE 1=1"
                params = []

                if done is not None:
                    sql += " AND done = %s"
                    params.append(done)

                if search is not None and search.strip():
                    sql += " AND LOWER(title) LIKE %s"
                    params.append(f"%{search.lower()}%")

                sql += " ORDER BY id ASC;"

                cur.execute(sql, params)
                return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})

# GET /tasks/{id} - Reads a single item securely via placeholders
@app.get("/tasks/{id}")
def read_task(id: int):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM tasks WHERE id = %s;", (id,))
                task = cur.fetchone()

                if task is None:
                    raise HTTPException(
                        status_code=404,
                        detail={"error": f"Task {id} not found"}
                    )
                return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})
```

### Checkpoint Verification

```bash
# Verify fetching all rows
curl -i http://localhost:3000/tasks

# Verify failing on an unknown key
curl -i http://localhost:3000/tasks/999
```

---

## Stage 3: Create, Update, Delete on Postgres

Complete the data mutation loop (`POST`, `PUT`, `DELETE`) directly on Postgres, using the `RETURNING *` clause to match your API's expected lifecycle feedback.

### Node.js Lane (Express)

```javascript
// POST /tasks - Create a task and return the new row with its generated ID
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *;',
      [title.trim(), false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /tasks/:id - Fully update a row with validation and tracking checks
app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task ID format" });

  const { title, done } = req.body;
  if (title === undefined && done === undefined) return res.status(400).json({ error: "Missing fields to update" });
  if (title !== undefined && (!title || title.trim() === "")) return res.status(400).json({ error: "Title cannot be empty" });
  if (done !== undefined && typeof done !== "boolean") return res.status(400).json({ error: "done must be boolean" });

  try {
    // 1. Fetch current task state to evaluate undefined properties
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1;', [taskId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: `Task ${taskId} not found` });
    }

    const finalTitle = title !== undefined ? title.trim() : existing.rows[0].title;
    const finalDone = done !== undefined ? done : existing.rows[0].done;

    // 2. Perform the update
    const result = await pool.query(
      'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *;',
      [finalTitle, finalDone, taskId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /tasks/:id - Remove row and return empty 204 response
app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task ID format" });

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *;', [taskId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Task ${taskId} not found` });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Python Lane (FastAPI)

```python
from pydantic import BaseModel, Field
from typing import Optional

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    done: Optional[bool] = None

# POST /tasks - Create a task
@app.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(task_input: TaskCreate):
    if not task_input.title.strip():
        raise HTTPException(status_code=400, detail={"error": "Title cannot be empty"})

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO tasks (title, done) VALUES (%s, %s) RETURNING *;",
                    (task_input.title.strip(), False)
                )
                new_task = cur.fetchone()
                conn.commit()
                return new_task
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})

# PUT /tasks/{id} - Safely update a task's fields
@app.put("/tasks/{id}")
def update_task(id: int, task_input: TaskUpdate):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Look up existing row
                cur.execute("SELECT * FROM tasks WHERE id = %s;", (id,))
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(status_code=404, detail={"error": "Task not found"})

                final_title = task_input.title.strip() if task_input.title is not None else row["title"]
                final_done = task_input.done if task_input.done is not None else row["done"]

                # 2. Apply the update
                cur.execute(
                    "UPDATE tasks SET title = %s, done = %s WHERE id = %s RETURNING *;",
                    (final_title, final_done, id)
                )
                updated_task = cur.fetchone()
                conn.commit()
                return updated_task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})

# DELETE /tasks/{id} - Remove a row
@app.delete("/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(id: int):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM tasks WHERE id = %s RETURNING *;", (id,))
                deleted_row = cur.fetchone()
                if deleted_row is None:
                    raise HTTPException(status_code=404, detail={"error": "Task not found"})
                conn.commit()
                return None  # Emits empty 204 response body
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})
```

### Checkpoint: Full Lifecycle Test

```bash
# 1. Create a task (should respond with 201 Created and an auto-assigned ID, e.g. 4)
curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Deploy to Production"}' http://localhost:3000/tasks

# 2. Mark that newly created task (ID 4) as done using PUT (should return 200 OK)
curl -i -X PUT -H "Content-Type: application/json" -d '{"done":true}' http://localhost:3000/tasks/4

# 3. Pull the tasks list to check changes (should see the updated row)
curl -i http://localhost:3000/tasks

# 4. Delete the task (should return 204 No Content with empty body)
curl -i -X DELETE http://localhost:3000/tasks/4

# 5. Confirm deletion (should return a 404 error)
curl -i http://localhost:3000/tasks/4
```

---

## Stage 4: One Command for the Whole Stack (Docker Compose)

Containerize the application and combine it with the database so the entire stack starts with a single command.

### 1. Create a `Dockerfile`

**Node.js lane:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Python lane:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Create `compose.yaml`

This maps your application inside Docker's internal network to find the database at `db:5432` instead of `localhost:5432`.

> Note: change `ports` to `"8000:8000"` under the `api` service if you are using the Python lane.

```yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://postgres:dev@db:5432/tasks
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: tasks
    volumes:
      - taskdata:/var/lib/postgresql/data

volumes:
  taskdata:
```

### 3. Execution & Verification

```bash
# Stop old baseline instance
docker stop taskdb

# Start the unified container environment
docker compose up --build
```

### Checkpoint: Lifecycle & Persistence Test

```bash
# 1. Create a couple of task entries
curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Dockerize Stack"}' http://localhost:3000/tasks
curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Test Persistence"}' http://localhost:3000/tasks

# 2. Tear down the whole stack
docker compose down

# 3. Spin the environment back up
docker compose up -d

# 4. Confirm data persists thanks to the named volume
curl -i http://localhost:3000/tasks
```

---

## Stage 5: Final Documentation & Publish to GitHub

Prepare your project files so any team member can clone, launch, and test the entire stack in under 60 seconds.

### 1. Finalize `README.md`

Replace your root `README.md` with production-grade content covering:
- **One-command quick start:**
  ```bash
  # 1. Clone the project and step into the directory
  git clone <YOUR_GITHUB_REPOSITORY_URL>
  cd <YOUR_PROJECT_FOLDER>

  # 2. Copy the environment variables template
  cp .env.example .env

  # 3. Boot up the entire stack
  docker compose up --build
  ```
- **Configuration & variables table** — document `DATABASE_URL` and any other env vars, with placeholder sample values.
- **API endpoint routing reference table** — route, method, expected body/params, response codes, description for each of `/tasks`, `/tasks/:id` (GET, POST, PUT, DELETE).
- **Production verification logs** — a sample `curl -i` call and its response, plus a database query sample showing seeded rows.

### 2. Guard Against Leaks (Security Checklist)

Before pushing to a remote repo, run these checks:

```bash
# Verify ignored files
git status --ignored
```
Confirm your live `.env` file (with real secrets) appears under the **ignored** list, not the staged files.

```bash
# Verify tracked files
git status
```
Confirm `compose.yaml`, `Dockerfile`, `db.js` (or `database.py`), `server.js` (or `main.py`), and `.env.example` are all properly tracked.

### 3. Commit and Publish

```bash
# 1. Stage all updated files and docs
git add server.js main.py db.js database.py Dockerfile compose.yaml .env.example README.md

# 2. Commit with a clear message
git commit -m "Stage 5: one-command stack + docs"

# 3. Push to GitHub
git push origin main
```

---

## Stage 6 (Optional Extras)

Bonus experiments once the core stack is working.

### Experiment 1: The Health Check (Recommended)

Real production gateways check more than just the web server — they verify the app can talk to storage before allowing traffic through.

**Node.js (`db.js` / `server.js`):**
```javascript
// Add to your server endpoints
app.get('/health', async (req, res) => {
  try {
    // Run a lightweight test query natively on the engine
    await pool.query('SELECT 1;');
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", details: err.message });
  }
});
```

**Python (`database.py` / `main.py`):**
```python
@app.get("/health")
def health_check():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                return {"status": "ok", "db": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"status": "error", "db": "disconnected", "error": str(e)}
        )
```

### Experiment 2: The Multi-Stage Docker Build

Shrink your production image footprint with a multi-stage build that leaves build dependencies behind.

**Node.js `Dockerfile` (Before: ~180MB | After: ~60MB):**
```dockerfile
# Stage 1: Build & install dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Lean runtime
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

**Python `Dockerfile` (Before: ~450MB | After: ~120MB):**
```dockerfile
# Stage 1: Build wheel packages
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 2: Slim runtime layer
FROM python:3.11-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache /wheels/*
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Experiment 3: Database Performance Profiling (`EXPLAIN`)

If your task list grows to millions of rows, searching without an index forces a slow, full-table scan.

```sql
-- Profile search queries before adding an index
EXPLAIN ANALYZE SELECT * FROM tasks WHERE done = false;
-- Output will show a "Seq Scan" (Sequential Scan), reading every row.

-- Add an index
CREATE INDEX idx_tasks_done ON tasks(done);

-- Re-check the query plan
EXPLAIN ANALYZE SELECT * FROM tasks WHERE done = false;
-- Output will now show a fast "Bitmap Index Scan".
```

### Reflection: Updating your `README.md` (The Persistence Experiment)

If you tried removing your volume mounts to watch data disappear, document the conclusion under an infrastructure subsection:

```markdown
### 📝 The Persistence Experiment Reflection
Without external volume mounts, database changes are written entirely to the
container's temporary filesystem layer. Once the container is removed, that
layer — and all the data in it — is gone for good. Named volumes (like
`taskdata` in compose.yaml) exist independently of the container lifecycle,
which is what makes data durable across `docker compose down` / `up` cycles.
```

### Final Commit

```bash
git add .
git commit -m "Extras: added native health checks and optimized multi-stage build footprint"
git push origin main
```
