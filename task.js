const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Open (and automatically create) the tasks.db file
const db = new Database('tasks.db');

// Create the tasks table if it does not exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Migration guard: add columns if an older database file is missing them
try {
  db.prepare("ALTER TABLE tasks ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE tasks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
} catch (e) {}

// Check if the table is empty before seeding example data
const rowCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
if (rowCount.count === 0) {
  const insertTask = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insertTask.run("Buy groceries", 0);
  insertTask.run("Clean the room", 1);
  insertTask.run("Study API design", 0);
}

// GET /tasks (with optional done and search filters)
app.get('/tasks', (req, res) => {
  const { done, search } = req.query;
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (done !== undefined) {
    query += ' AND done = ?';
    params.push(done === 'true' ? 1 : 0);
  }

  if (search !== undefined && search.trim() !== "") {
    query += ' AND LOWER(title) LIKE ?';
    params.push(`%${search.toLowerCase()}%`);
  }

  query += ' ORDER BY id ASC';

  const rows = db.prepare(query).all(...params);

  const tasks = rows.map(row => ({
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    created_at: row.created_at,
    updated_at: row.updated_at
  }));

  res.json(tasks);
});

// GET /stats (natively computed statistics)
app.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const done = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE done = 1').get().count;
  const open = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE done = 0').get().count;
  res.json({ total, done, open });
});

// GET /tasks/:id (single selection)
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!row) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.json({
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    created_at: row.created_at,
    updated_at: row.updated_at
  });
});

// POST /tasks (create new task)
app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)');
  const result = insertStmt.run(title.trim());

  const newId = result.lastInsertRowid;
  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);

  res.status(201).json({
    id: Number(newTask.id),
    title: newTask.title,
    done: Boolean(newTask.done),
    created_at: newTask.created_at,
    updated_at: newTask.updated_at
  });
});

// PUT /tasks/:id (update existing task)
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  const { title, done } = req.body || {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Missing fields to update" });
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === "")) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "Done must be a boolean value" });
  }

  const currentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!currentTask) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const finalTitle = title !== undefined ? title.trim() : currentTask.title;
  const finalDone = done !== undefined ? (done ? 1 : 0) : currentTask.done;

  db.prepare(`
    UPDATE tasks
    SET title = ?, done = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(finalTitle, finalDone, taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  res.json({
    id: updatedTask.id,
    title: updatedTask.title,
    done: Boolean(updatedTask.done),
    created_at: updatedTask.created_at,
    updated_at: updatedTask.updated_at
  });
});

// DELETE /tasks/:id (delete task)
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

  if (result.changes === 0) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
