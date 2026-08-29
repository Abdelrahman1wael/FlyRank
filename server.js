const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const pool = require('./db'); // Import the Postgres connection pool

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks", "/stats", "/health"] });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1;');
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

// GET /stats — Calculates summary information from Postgres
app.get('/stats', async (req, res) => {
  try {
    const totalRes = await pool.query('SELECT COUNT(*) FROM tasks;');
    const doneRes = await pool.query('SELECT COUNT(*) FROM tasks WHERE done = true;');
    const total = parseInt(totalRes.rows[0].count, 10);
    const done = parseInt(doneRes.rows[0].count, 10);
    const open = total - done;
    res.json({ total, done, open });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reset — Re-seeds initial values in Postgres
app.post('/reset', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE tasks RESTART IDENTITY;');
    const seedQuery = `
      INSERT INTO tasks (title, done) VALUES
      ('Buy groceries', false),
      ('Clean the room', true),
      ('Study API design', false);
    `;
    await pool.query(seedQuery);
    res.json({ message: "Database reset to initial seed values", count: 3 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));