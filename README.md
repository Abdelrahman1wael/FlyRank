# 📋 Task Management API (SQLite Version)

A persistent REST API built with Node.js, Express, and SQLite (`better-sqlite3`).

---

## 🛠 System Architecture & Design Decisions

### Why SQLite?
- **Single-File Storage**: The entire database lives in a single file (`tasks.db`) on disk, eliminating the need to set up complex database server processes.
- **Zero Configuration**: No separate server installation, user permissions, or network configuration required.
- **Data Persistence**: Data survives application restarts, server crashes, and system reboots.
- **Speed & Efficiency**: Executes SQL directly inside the application process without IPC network latency.

### Database Location & Automatic Creation
- Data is stored in `tasks.db` at the root of the project.
- **Auto-Creation**: On a clean clone or when `tasks.db` is missing, the application automatically creates `tasks.db`, constructs the `tasks` schema table, and seeds initial data on first launch.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd FlyRank
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   *or*
   ```bash
   node task.js
   ```

The API server will listen at `http://localhost:3000`.

---

## 📡 API Endpoints & Request/Response Shapes

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/tasks` | Retrieve all tasks (supports `?done=true/false` and `?search=term`) | `200 OK` |
| `GET` | `/tasks/:id` | Retrieve a single task by ID | `200 OK`, `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `201 Created`, `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update an existing task | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/tasks/:id` | Delete a task by ID | `204 No Content`, `404 Not Found` |
| `GET` | `/stats` | Get natively computed task metrics | `200 OK` |

### Example cURL Commands

- **Get all tasks:**
  ```bash
  curl -i http://localhost:3000/tasks
  ```

- **Create a task:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" -d "{\"title\":\"Build SQLite backend\"}" http://localhost:3000/tasks
  ```

- **Update a task:**
  ```bash
  curl -i -X PUT -H "Content-Type: application/json" -d "{\"done\":true}" http://localhost:3000/tasks/1
  ```

- **Delete a task:**
  ```bash
  curl -i -X DELETE http://localhost:3000/tasks/1
  ```

---

## 🔍 Stage 4: SQLite Direct Database Exploration

Using **DB Browser for SQLite**, we inspected `tasks.db` directly to verify data consistency between SQL execution and the API.

### DB Browser Snapshot
![DB Browser Screenshot](./db_browser_screenshot.png)

### Hand-Executed SQL Query Examples

1. **Count total tasks:**
   ```sql
   SELECT COUNT(*) FROM tasks;
   ```
   *Result:* Returns total rows present in database table.

2. **Select completed tasks:**
   ```sql
   SELECT * FROM tasks WHERE done = 1;
   ```
   *Result:* Returns only tasks where `done` equals 1.

---

## 🔒 Security: Parameterized SQL Queries

All database operations use parameterized placeholders (`?`) to prevent SQL injection vulnerabilities:

```javascript
// Parameterized SQL Example from task.js
const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)');
insertStmt.run(title);
```

---

## 📜 Commit History & Timeline

The repository strictly reflects one commit per development stage:
- **Stage 0**: `Stage 0: create SQLite database`
- **Stage 1**: `Stage 1: database read endpoints`
- **Stage 2**: `Stage 2: insert into database`
- **Stage 3**: `Stage 3: update and delete with SQL`
- **Stage 4**: `Stage 4: explored SQLite`
- **Stage 5**: `Stage 5: database documentation`
