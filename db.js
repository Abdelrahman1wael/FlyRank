// db.js
const { Pool } = require('pg');
require('dotenv').config();



const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:dev@localhost:5432/my_new_database',
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
initDb().catch(err => {
  console.error('Database connection warning:', err.message);
});

module.exports = pool;