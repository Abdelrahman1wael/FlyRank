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