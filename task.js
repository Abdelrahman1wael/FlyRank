const express = require('express');
const Database = require('better-sqlite3');
const app = express();
const PORT = 3000;

app.use(express.json());

// Open (and automatically create) the tasks.db file
const db = new Database('tasks.db');

// Create the tasks table if it does not exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )
`).run();

// Check if the table is empty before seeding example data
const rowCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();

if (rowCount.count === 0) {
  const insertTask = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insertTask.run("Buy groceries", 0);
  insertTask.run("Clean the room", 1);
  insertTask.run("Study API design", 0);
}

// GET /tasks (with filtering)
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

  const rows = db.prepare(query).all(...params);

  // Format SQLite integers (0 or 1) into clean JSON booleans
  const tasks = rows.map(row => ({
    id: row.id,
    title: row.title,
    done: Boolean(row.done)
  }));

  res.json(tasks);
});

// GET /tasks/:id (single selection)
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!row) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.json({ id: row.id, title: row.title, done: Boolean(row.done) });
});