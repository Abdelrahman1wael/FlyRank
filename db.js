// db.js
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR: DATABASE_URL environment variable is not defined.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
  let connected = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!connected && attempts < maxAttempts) {
    attempts++;
    try {
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
        connected = true;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn(`Database connection attempt ${attempts}/${maxAttempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        console.error('Max database connection attempts reached. Could not initialize database.');
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Initialize connection immediately on module load
initDb().catch(err => {
  console.error('Database connection warning:', err.message);
});

module.exports = pool;