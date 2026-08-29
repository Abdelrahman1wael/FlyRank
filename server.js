import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ============================================
// 1. OPENAPI SPECIFICATION (WITH JWT BEARER AUTH)
// ============================================
const openapiSpecification = {
  openapi: "3.0.0",
  info: {
    title: "Supabase Auth API",
    version: "1.0.0",
    description: "API with complete signup, login, logout, and protected routes using Supabase"
  },
  components: {
    securitySchemes: {
      // Define the padlock configuration
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Supabase access_token (JWT) here."
      }
    }
  },
  paths: {
    "/auth/signup": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: {}, password: {} } } } }
        },
        responses: { 201: { description: "Created" }, 400: { description: "Bad Request" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Log in an existing user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: {}, password: {} } } } }
        },
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } }
      }
    },
    "/public/info": {
      get: {
        summary: "Get public information",
        responses: { 200: { description: "OK" } }
      }
    },
    "/auth/logout": {
      post: {
        summary: "Log out the current user",
        security: [{ BearerAuth: [] }], // Lock icon applied here
        responses: { 204: { description: "No Content" }, 401: { description: "Unauthorized" } }
      }
    },
    "/protected/profile": {
      get: {
        summary: "Get user profile details",
        security: [{ BearerAuth: [] }], // Lock icon applied here
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } }
      }
    },
    "/protected/dashboard": {
      get: {
        summary: "Get user dashboard data",
        security: [{ BearerAuth: [] }], // Lock icon applied here
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } }
      }
    }
  }
};

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// POST /auth/signup
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Bad Request" });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Bad Request" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: "Invalid login credentials" });
  }

  return res.status(200).json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token
  });
});

// GET /public/info
app.get('/public/info', (req, res) => {
  return res.status(200).json({ message: "Welcome stranger! This info is public." });
});

// GET /protected/profile
app.get('/protected/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Token is present (unverified for now)
  return res.status(200).json({
    message: "You presented a token! Verification logic goes here in the next stage."
  });
});

app.get('/protected/profile', async (req, res) => {
  const authHeader = req.headers.authorization;

  // 1. Extract and validate header presence
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Access token required" });
  }

  const parts = authHeader.split(' ');
  const token = parts[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // 2. Ask Supabase if the token is authentic
  const { data: { user }, error } = await supabase.auth.getUser(token);

  // 3. Turn away expired, tampered, or invalid tokens
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // 4. Return safe user metadata on success
  return res.status(200).json({
    id: user.id,
    email: user.email,
    created_at: user.created_at
  });
});

// POST /auth/logout (Protected Route)
app.post('/auth/logout', requireAuth, async (req, res) => {
  // Pass the user's specific access token to scope the sign-out globally
  const { error } = await supabase.auth.admin.signOut(req.token);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.sendStatus(204);
});

// ============================================
// 3. PROTECTED ROUTES
// ============================================
app.get('/protected/profile', requireAuth, (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at
  });
});

app.get('/protected/dashboard', requireAuth, (req, res) => {
  return res.status(200).json({
    message: `Welcome to your dashboard, ${req.user.email}!`,
    stats: { premium: true }
  });
});


app.listen(3000, () => console.log('Server running on port 3000'));