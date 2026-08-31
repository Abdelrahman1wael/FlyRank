// test.js - Automated Postgres & API Integration Test
const pool = require('./db');
const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to send HTTP requests
function httpRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running PostgreSQL Database & API Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Direct PostgreSQL Query Test
    console.log('--- 1. Testing Direct PostgreSQL Connection & Table ---');
    const dbRes = await pool.query('SELECT COUNT(*) FROM tasks;');
    const count = parseInt(dbRes.rows[0].count, 10);
    assert(count >= 0, `Connected to Postgres. Found ${count} rows in 'tasks' table.`);

    // 2. Health Endpoint Test
    console.log('\n--- 2. Testing API Health Endpoint ---');
    const health = await httpRequest('/health');
    assert(health.status === 200 && health.body.db === 'connected', 'GET /health returns 200 and db: connected');

    // 3. GET /tasks
    console.log('\n--- 3. Testing GET /tasks ---');
    const getTasks = await httpRequest('/tasks');
    assert(getTasks.status === 200 && Array.isArray(getTasks.body), 'GET /tasks returns 200 with an array');

    // 4. POST /tasks (Create)
    console.log('\n--- 4. Testing POST /tasks (Create) ---');
    const postRes = await httpRequest('/tasks', 'POST', { title: 'Automated Test Task' });
    assert(postRes.status === 201 && postRes.body.title === 'Automated Test Task', 'POST /tasks returns 201 with created task');
    const createdId = postRes.body ? postRes.body.id : null;

    // 5. GET /tasks/:id (Read single)
    if (createdId) {
      console.log(`\n--- 5. Testing GET /tasks/${createdId} ---`);
      const getOne = await httpRequest(`/tasks/${createdId}`);
      assert(getOne.status === 200 && getOne.body.id === createdId, `GET /tasks/${createdId} returns task object`);

      // 6. PUT /tasks/:id (Update)
      console.log(`\n--- 6. Testing PUT /tasks/${createdId} ---`);
      const putRes = await httpRequest(`/tasks/${createdId}`, 'PUT', { done: true });
      assert(putRes.status === 200 && putRes.body.done === true, `PUT /tasks/${createdId} updates done status to true`);

      // 7. DELETE /tasks/:id (Delete)
      console.log(`\n--- 7. Testing DELETE /tasks/${createdId} ---`);
      const delRes = await httpRequest(`/tasks/${createdId}`, 'DELETE');
      assert(delRes.status === 204, `DELETE /tasks/${createdId} returns 204 No Content`);

      // 8. Confirm deletion
      const confirmDel = await httpRequest(`/tasks/${createdId}`);
      assert(confirmDel.status === 404, `GET /tasks/${createdId} after deletion returns 404`);
    }

    console.log(`\n========================================`);
    console.log(`Test Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
