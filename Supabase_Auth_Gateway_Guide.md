# Supabase Auth Gateway — Complete Build Guide

A step-by-step build of a production-style REST API authentication service using **Node.js/Express** or **Python/FastAPI**, backed by **Supabase Auth**. This guide merges all stages of the project into one organized reference, in the order they're meant to be built.

**Endpoints covered:**

| Route | Method | Access | Success Status |
|---|---|---|---|
| `/auth/signup` | POST | Public | 201 Created |
| `/auth/login` | POST | Public | 200 OK |
| `/public/info` | GET | Public | 200 OK |
| `/auth/logout` | POST | Protected | 204 No Content |
| `/protected/profile` | GET | Protected | 200 OK |
| `/protected/dashboard` | GET | Protected | 200 OK |

All protected endpoints expect a standard bearer token: `Authorization: Bearer <your_jwt_access_token>`.

---

## Stage 0 — Set Up Supabase & Your Server

**1. Project initialization**

```bash
mkdir auth-practice
cd auth-practice
npm init -y
npm install express @supabase/supabase-js dotenv
npm install --save-dev nodemon
```

**2. Environment variables (`.env`)**

```env
PORT=3000
SUPABASE_URL=https://supabase.co
SUPABASE_KEY=your_anon_public_key_here
```

**3. `.gitignore`** — created in this stage, expanded in Stage 6 (see below).

**4. `server.js` — Express + Supabase init**

```javascript
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} and connected to Supabase.`);
});
```

*(Add `"type": "module"` to `package.json` to use `import` syntax.)*

**5. `package.json` scripts**

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

**Verification checklist**
1. In the Supabase dashboard, turn off **"Confirm email"** under Authentication → Providers → Email (so signup/login testing doesn't require inbox access).
2. Run `npm run dev`.
3. Confirm the terminal logs: `🚀 Server running on port 3000 and connected to Supabase.`

```bash
git init
git add .
git commit -m "Stage 0: setup server and supabase client"
```

---

## Stage 1 — Signup & Login Routes

### Node.js (Express)

```javascript
import { createClient } from '@supabase/supabase-js';
import express from 'express';

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Python (FastAPI)

```python
import os
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client

app = FastAPI()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class AuthSchema(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(credentials: AuthSchema):
    # Pydantic handles missing/empty fields validation natively and throws 422/400
    try:
        response = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login", status_code=status.HTTP_200_OK)
def login(credentials: AuthSchema):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token
        }
    except Exception:
        # Catching Supabase auth execution failures (wrong email/password)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials"
        )
```

---

## Stage 2 — Public Route & Unverified Protected Route

Adds a public route and a first pass at a protected route that only checks that *a* token is present (verification comes in Stage 3).

### Node.js (Express)

```javascript
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
```

### Python (FastAPI)

```python
from fastapi import Request

@app.get("/public/info", status_code=status.HTTP_200_OK)
def get_public_info():
    return {"message": "Welcome stranger! This info is public."}

@app.get("/protected/profile", status_code=status.HTTP_200_OK)
def get_protected_profile(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required"
        )

    try:
        token = auth_header.split(" ")[1]
        if not token:
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required"
        )

    return {"message": "You presented a token! Verification logic goes here in the next stage."}
```

> **Note (FastAPI):** to make a custom exception return `{"error": "..."}` instead of FastAPI's default `{"detail": "..."}`, catch `HTTPException` in a global exception handler (shown in Stage 4) or return `JSONResponse(status_code=401, content={"error": "..."})` directly.

---

## Stage 3 — Real Token Verification

Passes the extracted token to Supabase to confirm it's genuine.

### Node.js (Express)

```javascript
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
```

### Python (FastAPI)

```python
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

@app.get("/protected/profile")
def get_protected_profile(request: Request):
    auth_header = request.headers.get("Authorization")

    # 1. Extract and validate header presence
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Access token required"}
        )

    try:
        parts = auth_header.split(" ")
        token = parts[1]
    except IndexError:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Access token required"}
        )

    # 2. Ask Supabase if the token is authentic
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise ValueError()
    # 3. Turn away expired, tampered, or invalid tokens
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Invalid or expired token"}
        )

    # 4. Return safe user metadata on success
    return {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at
    }
```

⚠️ **Security tip:** always check `if (error || !user)` — never `if (data)` alone. Supabase can return a stub `data` object with an internal error payload for an expired token; trusting data *existence* instead of checking the error can let forged/expired sessions through (see [Stage 7 audit](#stage-7--ai-vs-me-a-comparative-code-review) below).

---

## Stage 4 — Reusable Auth Middleware & Logout Endpoint

Extracts the verification logic from Stage 3 into a single reusable guard, and adds a protected logout route.

### Node.js (Express)

```javascript
import { createClient } from '@supabase/supabase-js';
import express from 'express';

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ============================================
// 1. REUSABLE MIDDLEWARE GUARD
// ============================================
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Attach the verified user and token to the request object
  req.user = user;
  req.token = token;
  next();
}

// ============================================
// 2. PUBLIC & AUTH ROUTES (From Stage 1)
// ============================================
app.post('/auth/signup', async (req, res) => { /* ... */ });
app.post('/auth/login', async (req, res) => { /* ... */ });
app.get('/public/info', (req, res) => { /* ... */ });

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
```

### Python (FastAPI)

```python
import os
from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from supabase import create_client, Client

app = FastAPI()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_ANON_KEY"))

# ============================================
# 1. REUSABLE DEPENDENCY GUARD
# ============================================
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Access token required")

    try:
        token = auth_header.split(" ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Access token required")

    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise ValueError()
        # Return a dictionary containing both user details and the raw token
        return {"user": user, "token": token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Custom global handler to force FastAPI's HTTPException detail into your custom {"error": ...} shape
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

# ============================================
# 2. PUBLIC & AUTH ROUTES
# ============================================
@app.post("/auth/signup")
def signup(): pass

@app.post("/auth/login")
def login(): pass

@app.get("/public/info")
def public_info(): pass

# POST /auth/logout (Protected Route)
@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_auth: dict = Depends(get_current_user)):
    try:
        # FastAPI's supabase client exposes sign_out. We supply the JWT scope if needed.
        supabase.auth.sign_out(current_auth["token"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None

# ============================================
# 3. PROTECTED ROUTES
# ============================================
@app.get("/protected/profile")
def get_protected_profile(current_auth: dict = Depends(get_current_user)):
    user = current_auth["user"]
    return {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at
    }

@app.get("/protected/dashboard")
def get_protected_dashboard(current_auth: dict = Depends(get_current_user)):
    user = current_auth["user"]
    return {
        "message": f"Welcome to your dashboard, {user.email}!",
        "stats": {"premium": True}
    }
```

---

## Stage 5 — Swagger / OpenAPI Docs with Bearer Auth

Configures interactive API docs so a global lock icon lets you authenticate once and test every protected endpoint from the browser.

### Node.js (Express)

Install: `npm install swagger-ui-express`

```javascript
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

// ============================================
// 2. EXISTING MIDDLEWARE & ROUTES FROM STAGE 4
// ============================================
async function requireAuth(req, res, next) { /* ... same as Stage 4 ... */ }
app.post('/auth/signup', async (req, res) => { /* ... */ });
app.post('/auth/login', async (req, res) => { /* ... */ });
app.get('/public/info', (req, res) => { /* ... */ });
app.post('/auth/logout', requireAuth, async (req, res) => { /* ... */ });
app.get('/protected/profile', requireAuth, (req, res) => { /* ... */ });
app.get('/protected/dashboard', requireAuth, (req, res) => { /* ... */ });

app.listen(3000, () => console.log('Server running on http://localhost:3000 (Docs at /docs)'));
```

### Python (FastAPI)

FastAPI autogenerates documentation out of the box. To add the authorization locks to `/docs`, swap the raw header extraction for FastAPI's native `HTTPBearer` security dependency.

```python
import os
from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

app = FastAPI(
    title="Supabase Auth API",
    description="API with complete signup, login, logout, and protected routes using Supabase"
)
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_ANON_KEY"))

# 1. Initialize FastAPI's native Bearer scheme
security_scheme = HTTPBearer()

# ============================================
# 2. UPDATED DEPENDENCY GUARD
# ============================================
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    # FastAPI automatically handles header parsing and enforces the structural check.
    # If the 'Authorization: Bearer <token>' header is missing, FastAPI automatically
    # yields a 403. To match your custom 401 requirement precisely, we intercept errors.
    token = credentials.credentials

    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise ValueError()
        return {"user": user, "token": token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Override to ensure exact API response JSON compliance
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

# ============================================
# 3. PUBLIC & AUTH ENDPOINTS
# ============================================
@app.post("/auth/signup")
def signup(): pass

@app.post("/auth/login")
def login(): pass

@app.get("/public/info")
def public_info(): pass

# ============================================
# 4. PROTECTED ENDPOINTS (Locks automatically applied via Depends)
# ============================================
@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_auth: dict = Depends(get_current_user)):
    try:
        supabase.auth.sign_out(current_auth["token"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None

@app.get("/protected/profile")
def get_protected_profile(current_auth: dict = Depends(get_current_user)):
    user = current_auth["user"]
    return {"id": user.id, "email": user.email, "created_at": user.created_at}

@app.get("/protected/dashboard")
def get_protected_dashboard(current_auth: dict = Depends(get_current_user)):
    user = current_auth["user"]
    return {"message": f"Welcome to your dashboard, {user.email}!", "stats": {"premium": True}}
```

Open `http://localhost:3000/docs` (or port `8000` for Python), click the global **Authorize** button top-right, paste your JWT, and click "Try it out" across the locked endpoints.

---

## Stage 6 — Publish to GitHub

**1. Protect your secrets — `.gitignore`**

```text
# Secrets and environments
.env
.env.local
.env.development.local

# Dependency directories
node_modules/
__pycache__/
*.pyc

# OS metadata
.DS_Store
```

**2. Share the blueprint — `.env.example`**

```text
SUPABASE_URL=https://supabase.co
SUPABASE_ANON_KEY=your-actual-supabase-anon-or-public-api-key
PORT=3000
```

**3. `README.md`**

````markdown
# Supabase Node/FastAPI Auth Gateway

A fully-featured, production-ready REST API authentication system powered by Supabase.

## 🚀 Quick Start (Under 5 Minutes)

### 1. Prerequisites & Environment Setup
Clone this repository to your local machine, then navigate to the root directory.

```bash
cp .env.example .env
```
Open `.env` and paste your project's `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### 2. Run the Application
Execute the following commands to install dependencies and boot up the server:

# For Node.js (Express) lane
npm install
npm run start

# For Python (FastAPI) lane
pip install -r requirements.txt
uvicorn main:app --reload
````

**API Reference Matrix** — see the table at the top of this guide.

**Interactive Sandbox Documentation (Swagger UI)** — once your server is running, go to `http://localhost:3000/docs`. Use the **Authorize** padlock in the upper-right to mount your logged-in JWT, then execute requests interactively.

**4. Git deployment protocol**

```bash
# 1. Double check .env is safely ignored (should print nothing, or show it under "Ignored files")
git status --ignored

# 2. Add your clean source files
git add .gitignore .env.example README.md main.js package.json main.py requirements.txt

# 3. Finalize the Stage 6 checkpoint commit
git commit -m "Stage 6: publish to GitHub and write README"

# 4. Bind your local staging area to your fresh public remote repo
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main

# 5. Push your 6-stage development timeline out to the world
git push -u origin main
```

---

## Stage 7 — AI vs Me: A Comparative Code Review

A structured exercise: regenerate the same spec with an AI model *in isolation*, then diff it against your own hand-written implementation to find blind spots.

**1. Set up an isolation zone**

```bash
my-auth-gateway/
├── .env
├── .gitignore
├── README.md              # Your original project guide
├── stage1-6-code/         # Your trusted hand-written implementation
│   └── main.js (or main.py)
└── ai-version/             # The quarantine zone
    └── main.js (or main.py)
```

**2. Draft your engineering prompt from memory** (don't copy-paste earlier prompts). It should specify:
1. **Architecture** — Node/Express or Python/FastAPI + Supabase client.
2. **Endpoints & strict status codes** — `POST /auth/signup` (201), `POST /auth/login` (200), `GET /public/info` (200), `POST /auth/logout` (204), `GET /protected/profile` (200).
3. **Validation barriers** — `400 Bad Request` for missing inputs, `401 Unauthorized` for missing/invalid bearer tokens.
4. **A centralized guard** — protected routes secured via a single reusable middleware/dependency that extracts the token and validates it via `getUser()`.
5. **OpenAPI documentation** — interactive Swagger setup with a mounted global `HTTP Bearer` security scheme.

**3. Audit checklist (code review)**

```bash
git diff --no-index stage1-6-code/main.js ai-version/main.js
```

Evaluate the AI's output against these known failure modes:

- **Token extraction stability** — does it use rigid array splitting (`split(' ')[1]`) that throws an uncaught runtime error and crashes the server if a client sends an empty `Authorization: Bearer` string?
- **The Supabase trust trap** — does it correctly evaluate the error object, or does it trust `data` existence alone?

  ```javascript
  // 🚩 SECURITY FLAW: trusting data existence instead of checking the error
  const { data } = await supabase.auth.getUser(token);
  if (data) { ... }
  ```

  An expired token can still return a `data` stub with an internal error payload. Without an explicit `if (error || !data?.user)` check, a forged/expired session can slip through.
- **Leaky configuration** — did it initialize the client with `process.env.SUPABASE_SERVICE_ROLE_KEY` instead of the `ANON_KEY`? The service role key bypasses Row Level Security entirely, turning the client into a superuser.

**4. Update your `README.md`** — append an evaluative block documenting:
- The original prompt used
- Architectural differences & anomalies (token handling resilience, security/exception handling, silent assumptions the prompt didn't specify)
- The prompt evolution (what you'd add to the prompt next time, e.g. *"Ensure all error responses strictly follow this JSON schema..."*)

**5. Deploy the checkpoint**

```bash
git add ai-version/ README.md
git commit -m "Stage 7: AI vs me (AI code stays in its own folder/branch)"
git push origin main
```

---

## Extras (Optional Deep-Dives)

### Extra 1 — Read the Token Yourself (JWT Analysis)

Paste your Supabase access token into [jwt.io](https://jwt.io) and you'll find a JSON payload containing the user's unique ID (`sub`), email, role (usually `authenticated`), issuing timestamp (`iat`), expiration time (`exp`), and app metadata.

**Why you never put secrets inside a JWT:** a JWT is only *encoded and cryptographically signed*, not encrypted. Anyone who intercepts it can decode it instantly with standard base64 tools — so confidential data like passwords or card numbers would be fully exposed.

### Extra 2 — A 403 Case (Authentication vs. Authorization)

Adds a role-based access layer, contrasting **401 Unauthorized** ("we don't know who you are, or your token is invalid") with **403 Forbidden** ("we know exactly who you are, but you don't have permission for this asset").

**Node.js (Express)**

```javascript
// Middleware to ensure the authenticated user has an 'admin' role
function requireAdmin(req, res, next) {
  // Supabase stores roles inside app_metadata
  const userRole = req.user?.app_metadata?.role;

  if (userRole !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}

// Chain the middlewares: first verify identity (requireAuth), then check permissions (requireAdmin)
app.get('/protected/admin-panel', requireAuth, requireAdmin, (req, res) => {
  return res.status(200).json({ message: "Welcome to the secret admin control center!" });
});
```

**Python (FastAPI)**

```python
def require_admin(current_auth: dict = Depends(get_current_user)):
    user = current_auth["user"]
    # Inspect user's app_metadata for the correct role mapping
    user_role = user.app_metadata.get("role")

    if user_role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    return user

@app.get("/protected/admin-panel")
def get_admin_panel(admin_user = Depends(require_admin)):
    return {"message": "Welcome to the secret admin control center!"}
```

### Extra 3 — A Real Logout Test (The Stateless JWT Dilemma)

If you call `POST /auth/logout` and immediately try to reuse that same access token on `/protected/profile`, you may notice **the token can still work until it expires**, depending on your setup.

**Why this happens:** JWTs are stateless. When your server calls `supabase.auth.getUser(token)`, Supabase verifies the token's cryptographic signature locally without checking a central active-session database. Since the signature stays valid until expiration, the server still considers it good. To fix "instant logout" in production, apps typically maintain a short-lived **token blacklist** in a fast store like Redis to explicitly block recently logged-out tokens.

### Extra 4 — Refresh Flow (Session Renewal)

```python
try:
    response = supabase.auth.refresh_session(refresh_token)
    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token
    }
except Exception:
    raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
```

**Commit suggestion**

```bash
git add .
git commit -m "Extras: added 403 admin route and session token refresh endpoint"
git push
```

---

## Where to Go Next

- Implement **Role-Based Access Control (RBAC)** to restrict admin/dashboard access by role
- Add a **Redis-backed token blacklist** for instantaneous logout
- Add **refresh token handling** to swap expired access tokens without re-authenticating
- Set up **automated PostgreSQL Row Level Security (RLS)** to guard database entries at the data layer
- Write **automated tests** (Jest / PyTest) for the middleware and auth endpoints, mocking Supabase responses
- Refactor to **serverless Edge Functions**, or connect the backend to a **frontend framework (React/Vue)**
