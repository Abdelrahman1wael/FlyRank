
import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env"
  );
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

// ============================================
// AUTH MIDDLEWARE
// ============================================

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    // Verify token with Supabase
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    // Save token and user for protected routes
    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      error: "Authentication failed"
    });
  }
};

// ============================================
// SWAGGER / OPENAPI
// ============================================

const openapiSpecification = {
  openapi: "3.0.0",

  info: {
    title: "Supabase Auth API",
    version: "1.0.0",
    description:
      "Authentication API using Express.js and Supabase"
  },

  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Local development server"
    }
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter your Supabase access token (JWT)."
      }
    },

    schemas: {
      AuthRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com"
          },
          password: {
            type: "string",
            format: "password",
            example: "password123"
          }
        }
      }
    }
  },

  paths: {
    // ========================================
    // SIGNUP
    // ========================================

    "/auth/signup": {
      post: {
        summary: "Register a new user",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthRequest"
              }
            }
          }
        },

        responses: {
          201: {
            description: "User created successfully"
          },
          400: {
            description: "Bad request"
          }
        }
      }
    },

    // ========================================
    // LOGIN
    // ========================================

    "/auth/login": {
      post: {
        summary: "Login an existing user",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "Login successful"
          },
          400: {
            description: "Bad request"
          },
          401: {
            description: "Invalid credentials"
          }
        }
      }
    },

    // ========================================
    // PUBLIC INFO
    // ========================================

    "/public/info": {
      get: {
        summary: "Get public information",

        responses: {
          200: {
            description: "OK"
          }
        }
      }
    },

    // ========================================
    // LOGOUT
    // ========================================

    "/auth/logout": {
      post: {
        summary: "Logout current user",

        security: [
          {
            BearerAuth: []
          }
        ],

        responses: {
          204: {
            description: "Logout successful"
          },
          401: {
            description: "Unauthorized"
          }
        }
      }
    },

    // ========================================
    // PROFILE
    // ========================================

    "/protected/profile": {
      get: {
        summary: "Get authenticated user profile",

        security: [
          {
            BearerAuth: []
          }
        ],

        responses: {
          200: {
            description: "User profile"
          },
          401: {
            description: "Unauthorized"
          }
        }
      }
    },

    // ========================================
    // DASHBOARD
    // ========================================

    "/protected/dashboard": {
      get: {
        summary: "Get authenticated user dashboard",

        security: [
          {
            BearerAuth: []
          }
        ],

        responses: {
          200: {
            description: "Dashboard data"
          },
          401: {
            description: "Unauthorized"
          }
        }
      }
    }
  }
};

// Swagger UI
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpecification)
);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running smoothly"
  });
});

// ============================================
// AUTH ROUTES
// ============================================

// --------------------------------------------
// POST /auth/signup
// --------------------------------------------

app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// --------------------------------------------
// POST /auth/login
// --------------------------------------------

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      return res.status(401).json({
        error: "Invalid login credentials"
      });
    }

    return res.status(200).json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_in: data.session?.expires_in,
      user: data.user
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// --------------------------------------------
// POST /auth/logout
// --------------------------------------------

app.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    // Sign out the current Supabase session
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// ============================================
// PUBLIC ROUTES
// ============================================

// --------------------------------------------
// GET /public/info
// --------------------------------------------

app.get("/public/info", (req, res) => {
  return res.status(200).json({
    message: "Welcome stranger! This info is public."
  });
});

// ============================================
// PROTECTED ROUTES
// ============================================

// --------------------------------------------
// GET /protected/profile
// --------------------------------------------

app.get(
  "/protected/profile",
  requireAuth,
  (req, res) => {
    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at
    });
  }
);

// --------------------------------------------
// GET /protected/dashboard
// --------------------------------------------

app.get(
  "/protected/dashboard",
  requireAuth,
  (req, res) => {
    return res.status(200).json({
      message: `Welcome to your dashboard, ${req.user.email}!`,

      stats: {
        premium: true
      }
    });
  }
);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found"
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: "Internal server error"
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 Server started successfully");
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`📚 Swagger: http://localhost:${PORT}/docs`);
  console.log("=================================");
});
