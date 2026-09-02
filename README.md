# 🚀 FlyRank — Full-Stack & AI Engineering Training Program

Welcome to **FlyRank**, a comprehensive, production-grade training and internship repository designed to take engineers from backend fundamentals to full-stack development, secure APIs, distributed background jobs, LLM integrations, web scraping, automated pipelines, and AI vision capstones.

FlyRank follows an **engineering-first, hands-on methodology**, emphasizing production architecture, clean code, security, scalability, testing, and real-world system integration.

---

## 📖 Table of Contents

<details open>
<summary><b>Click to Expand / Collapse Table of Contents</b></summary>

1. [About FlyRank](#-about-flyrank)
2. [Learning Tracks](#-learning-tracks)
3. [Prerequisites](#-prerequisites)
4. [Production Backend Architecture & AI Integration](#-production-backend-architecture--ai-integration)

   * [1. CRUD System & SQLite](#1-crud-system--sqlite-integration)
   * [2. Layered Architecture](#2-layered-architecture)
   * [3. Authentication with Supabase](#3-identity--authentication-with-supabase)
   * [4. Third-Party AI API Integration](#4-third-party-ai-api-integration)
5. [Implementation Roadmap](#-implementation-roadmap)
6. [Training Progression](#-training-progression)
7. [Contributors & How to Contribute](#-flyrank-contributors--how-to-contribute)
8. [License](#-license)

</details>

---

# 🎯 About FlyRank

**FlyRank** is built around a practical, engineering-first approach to modern software development.

The program progresses from simple backend concepts to production-grade systems:

```text
Backend Fundamentals
        │
        ▼
In-Memory CRUD
        │
        ▼
SQLite + SQL Migrations
        │
        ▼
Layered Architecture
        │
        ▼
JWT Authentication
        │
        ▼
Postgres + Docker
        │
        ▼
Background Jobs & Queues
        │
        ▼
Web Scraping
        │
        ▼
LLM / AI APIs
        │
        ▼
Automated PDF & Data Pipelines
        │
        ▼
Distributed Systems
        │
        ▼
AI Multimodal Capstone
```

### Core Principles

* **Hands-On Engineering** — Build real applications rather than only studying theory.
* **Production Mindset** — Learn architecture, security, testing, observability, and scalability.
* **Dual-Track Learning** — Choose between **Node.js + Express** or **Python + FastAPI** for backend modules.
* **API-First Development** — Build RESTful services designed for frontend, mobile, and AI clients.
* **AI-Native Development** — Integrate LLMs and multimodal AI into production backend systems.
* **Progressive Complexity** — Move from local databases to distributed and cloud-ready architectures.
* **Clean Architecture** — Separate transport, business logic, and data-access concerns.

---

# 🛠️ Learning Tracks

FlyRank supports two primary backend technologies:

### 🟢 Node.js Track

```text
Node.js
   │
   ├── Express.js
   ├── REST APIs
   ├── SQLite
   ├── PostgreSQL
   ├── JWT
   ├── Docker
   ├── Redis / Queues
   └── AI API Integrations
```

### 🔵 Python Track

```text
Python
   │
   ├── FastAPI
   ├── REST APIs
   ├── SQLite
   ├── PostgreSQL
   ├── JWT
   ├── Docker
   ├── Celery / Queues
   └── AI API Integrations
```

The architectural principles remain the same regardless of the selected language.

---

# 📋 Prerequisites

Ensure the following tools are installed on your workstation.

### Node.js

```bash
node -v
```

Recommended:

```text
Node.js v18+
```

### Python

```bash
python3 --version
```

Recommended:

```text
Python v3.10+
```

### Docker

```bash
docker --version
docker compose version
```

### Git

```bash
git --version
```

### Recommended Development Tools

* VS Code
* Postman / Insomnia
* SQLite Browser
* GitHub
* Docker Desktop
* Terminal / PowerShell

---

# 🚀 Production Backend Architecture & AI Integration

This module teaches engineers how to transform a basic backend into a **secure, maintainable, production-oriented API platform**.

The module progresses from persistent CRUD operations using SQLite to authentication with Supabase and finally to secure third-party AI integrations.

## 🏗️ Target Architecture

```text
                         ┌──────────────────────┐
                         │       Client         │
                         │ Web / Mobile / CLI   │
                         └──────────┬───────────┘
                                    │
                                    │ JWT Bearer
                                    ▼
                         ┌──────────────────────┐
                         │ API / Auth Gateway   │
                         │ Middleware           │
                         └──────────┬───────────┘
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                       ▼                         ▼
              ┌────────────────┐       ┌─────────────────┐
              │ CRUD Controllers│       │ AI API Gateway  │
              └───────┬────────┘       └────────┬────────┘
                      │                         │
                      ▼                         ▼
              ┌────────────────┐       ┌─────────────────┐
              │ Service Layer  │       │ OpenAI /        │
              │ Business Logic │       │ Anthropic /     │
              └───────┬────────┘       │ OpenRouter      │
                      │                └─────────────────┘
                      ▼
              ┌────────────────┐
              │ Repository     │
              │ / Data Access  │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │ SQLite / DB    │
              │ Audit Logs     │
              └────────────────┘
```

---

# 1. CRUD System & SQLite Integration

Build a structured **Create, Read, Update, Delete (CRUD)** system for managing application resources using persistent storage.

### Database Engine

Use **SQLite**, a self-contained, serverless SQL database engine suitable for local development and lightweight production workloads.

Learn:

* Database initialization
* Tables and relationships
* Primary and foreign keys
* Indexes
* Constraints
* SQL migrations
* Transactions
* Parameterized queries
* Database error handling

### Connection Management

Configure reliable database access with:

* Connection lifecycle management
* Proper shutdown handling
* Transaction management
* WAL (Write-Ahead Logging) mode
* Concurrent read/write considerations

> SQLite connection handling differs from PostgreSQL connection pooling. The goal is to learn the appropriate connection strategy for each database engine rather than blindly applying pooling everywhere.

### Data Access Layer

Implement database access through a dedicated repository/data-access layer.

Example:

```text
repositories/
├── user.repository.js
├── task.repository.js
└── ai-log.repository.js
```

Use parameterized queries:

```sql
SELECT *
FROM users
WHERE id = ?;
```

Avoid constructing SQL queries directly from user input to prevent **SQL injection**.

---

# 2. Layered Architecture

As the application grows, move away from flat route files into a structured architecture.

```text
src/
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   └── ai.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── users.controller.js
│   └── ai.controller.js
│
├── services/
│   ├── auth.service.js
│   ├── users.service.js
│   └── ai.service.js
│
├── repositories/
│   ├── users.repository.js
│   └── ai-log.repository.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── rate-limit.middleware.js
│   └── logging.middleware.js
│
├── db/
│   ├── migrations/
│   └── connection.js
│
├── config/
│   └── environment.js
│
└── app.js
```

### Controller Layer

Responsible for:

* Receiving HTTP requests
* Validating request payloads
* Calling services
* Returning HTTP responses
* Mapping errors to appropriate status codes

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
Service
```

### Service Layer

Contains the application's business logic.

Examples:

* User ownership rules
* Resource validation
* AI request orchestration
* Transaction workflows
* Business rules

```text
Controller
    │
    ▼
Service
    │
    ├── Repository
    │
    └── External API
```

### Repository Layer

Responsible only for data access.

```text
Service
   │
   ▼
Repository
   │
   ▼
SQLite
```

This separation makes individual layers easier to test and replace.

### Middleware Stack

Implement reusable middleware for:

* Authentication
* Request logging
* Error handling
* CORS
* Rate limiting
* Request validation
* Security headers

---

# 3. Identity & Authentication with Supabase

Secure backend endpoints using **JWT Bearer authentication** with Supabase Auth.

### Authentication Architecture

```text
Client
  │
  │ Login / Signup
  ▼
Supabase Auth
  │
  │ JWT
  ▼
Client
  │
  │ Authorization:
  │ Bearer <JWT>
  ▼
Backend
  │
  ▼
Auth Middleware
  │
  ├── Verify token
  ├── Decode claims
  └── Attach user context
  │
  ▼
Protected Controller
```

### Supabase Responsibilities

Supabase Auth can handle:

* User registration
* Login
* Password hashing
* Email verification
* Session management
* Token issuance

The backend remains responsible for deciding **which authenticated users are authorized to perform specific actions**.

### Authentication Middleware

Implement a reusable:

```text
requireAuth
```

middleware.

Responsibilities:

1. Read the `Authorization` header.
2. Verify the Bearer token.
3. Validate its claims.
4. Extract the authenticated user's identity.
5. Attach the user context to the request.
6. Reject invalid or missing authentication.

Example request:

```http
Authorization: Bearer <JWT>
```

### User Ownership

Authenticated identity should flow through the service and repository layers.

```text
JWT
 │
 ▼
Auth Middleware
 │
 ▼
req.user
 │
 ▼
Service
 │
 ▼
Repository
 │
 ▼
User-Owned Records
```

For example:

```sql
SELECT *
FROM tasks
WHERE id = ?
  AND user_id = ?;
```

This prevents one authenticated user from accessing another user's records.

> **Security note:** Never trust a `user_id` supplied by the client when the authenticated identity is already available in the verified JWT.

---

# 4. Third-Party AI API Integration

Extend the backend with secure integrations to external Large Language Model providers.

Potential providers include:

* OpenAI
* Anthropic
* OpenRouter
* Other compatible AI providers

## AI Architecture

```text
Client
  │
  │ Authenticated Request
  ▼
API Controller
  │
  ▼
AI Service
  │
  ├── Validate Input
  ├── Build Prompt
  ├── Apply Business Rules
  └── Call Provider
          │
          ▼
      AI Provider
          │
          ▼
      AI Response
          │
          ▼
      Audit Log
          │
          ▼
        Client
```

### Secure Configuration

Never expose AI API keys to the frontend.

Use server-side environment variables:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
AI_API_KEY=...
```

For production environments, use an appropriate secret-management system instead of committing secrets to Git.

Never commit:

```text
.env
```

to the repository.

---

## Prompt Engineering Pipeline

Structure AI requests into predictable components:

```text
User Input
    │
    ▼
Validation
    │
    ▼
System Instructions
    │
    ▼
User Prompt
    │
    ▼
Structured AI Request
    │
    ▼
AI Provider
```

For applications requiring structured output, define an explicit JSON contract.

Example:

```json
{
  "summary": "string",
  "category": "string",
  "confidence": 0.0
}
```

The backend should validate the AI response before storing or returning it.

---

# 🌊 Streaming AI Responses

Support two major response patterns.

### Unary / Blocking Request

```text
Client
  │
  ▼
Backend
  │
  ▼
AI Provider
  │
  ▼
Complete Response
  │
  ▼
Client
```

### Streaming Response

```text
Client
  │
  ▼
Backend
  │
  ▼
AI Provider
  │
  ├── Token 1 ──┐
  ├── Token 2   │
  ├── Token 3   │
  └── Token N ──┘
                │
                ▼
              Client
```

Implement streaming using **Server-Sent Events (SSE)** or another appropriate streaming transport.

The backend should handle:

* Connection lifecycle
* Provider errors
* Client disconnects
* Partial responses
* Stream termination
* Rate limits

---

# 🛣️ Implementation Roadmap

## Phase 1 — SQLite Schema & Basic CRUD

### Objectives

Build the first persistent backend.

### Tasks

1. Define relational database schemas.
2. Create `.sql` migration files.
3. Initialize SQLite.
4. Configure WAL mode where appropriate.
5. Implement repositories.
6. Create CRUD services.
7. Expose REST endpoints.

Example:

```http
GET    /api/v1/tasks
GET    /api/v1/tasks/:id
POST   /api/v1/tasks
PUT    /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
```

### Deliverable

A working CRUD API backed by SQLite.

---

# Phase 2 — Layered Architecture

Refactor the initial implementation into:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
Database
```

### Tasks

1. Create explicit application layers.
2. Move business logic out of controllers.
3. Move SQL queries into repositories.
4. Introduce dependency injection.
5. Add centralized error handling.
6. Add request validation.
7. Add unit tests using mocks.

### Deliverable

A modular backend where each layer can be tested independently.

---

# Phase 3 — Supabase Authentication

### Tasks

1. Create a Supabase project.
2. Configure authentication.
3. Implement signup.
4. Implement login.
5. Handle sessions/tokens.
6. Add `requireAuth` middleware.
7. Protect CRUD routes.
8. Implement user ownership checks.

### Protected API Example

```http
POST /api/v1/tasks

Authorization: Bearer <JWT>

{
  "title": "Build AI API"
}
```

The backend obtains the authenticated user from the verified token rather than trusting client-provided identity information.

### Deliverable

A secure multi-user CRUD API.

---

# Phase 4 — AI Feature Pipeline

Create:

```http
POST /api/v1/generate
```

### Request Flow

```text
Client
  │
  ▼
JWT Authentication
  │
  ▼
Request Validation
  │
  ▼
AI Controller
  │
  ▼
AI Service
  │
  ├── Prompt Construction
  ├── Provider Configuration
  └── AI API Request
  │
  ▼
AI Response
  │
  ├── Validate
  ├── Sanitize
  └── Store Audit Record
  │
  ▼
Client
```

### AI Audit Log

Store useful metadata such as:

```text
id
user_id
provider
model
request_type
input
output
status
latency_ms
created_at
```

Avoid storing sensitive information unless the application explicitly requires it and appropriate privacy controls are in place.

### Deliverable

A secure authenticated AI API with persistence and audit logging.

---

# 🔐 Production Security Checklist

Before considering the backend production-ready, verify:

* [ ] JWT authentication implemented
* [ ] Authorization and ownership checks implemented
* [ ] Parameterized SQL queries used
* [ ] Secrets stored outside source code
* [ ] `.env` excluded from Git
* [ ] Request validation implemented
* [ ] Rate limiting implemented
* [ ] CORS configured correctly
* [ ] Centralized error handling implemented
* [ ] Security headers configured
* [ ] AI API keys never exposed to clients
* [ ] AI responses validated
* [ ] Provider failures handled
* [ ] Request timeouts configured
* [ ] Logging implemented
* [ ] AI audit logging implemented
* [ ] Database migrations versioned
* [ ] Graceful server/database shutdown implemented
* [ ] Unit and integration tests implemented

---

# 📈 Training Progression

FlyRank gradually increases system complexity.

| Stage | Technology / Concept      | Goal                   |
| ----- | ------------------------- | ---------------------- |
| 01    | In-Memory CRUD            | Backend fundamentals   |
| 02    | SQLite                    | Persistent data        |
| 03    | Layered Architecture      | Maintainability        |
| 04    | JWT / Supabase Auth       | Security               |
| 05    | PostgreSQL                | Production database    |
| 06    | Docker                    | Containerization       |
| 07    | Redis                     | Caching & messaging    |
| 08    | Background Jobs           | Async processing       |
| 09    | Web Scraping              | Data acquisition       |
| 10    | LLM APIs                  | AI integration         |
| 11    | SSE / Streaming           | Real-time AI responses |
| 12    | PDF Automation            | Document pipelines     |
| 13    | Distributed Cron / Queues | Distributed systems    |
| 14    | Multimodal AI             | Vision + language      |
| 15    | Graduation Capstone       | Full production system |

---

# 🎓 Graduation Capstone

The FlyRank graduation project combines the technologies learned throughout the program into a **full-scale AI Multimodal Engine**.

The capstone can integrate:

```text
                 ┌─────────────────┐
                 │ Web / Mobile UI │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Backend API     │
                 │ Auth + Security │
                 └────────┬────────┘
                          │
             ┌────────────┼─────────────┐
             ▼            ▼             ▼
        PostgreSQL      AI/LLM      Web Scraper
             │            │             │
             └────────────┼─────────────┘
                          ▼
                 ┌─────────────────┐
                 │ Processing      │
                 │ / Job Queue     │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ Analytics       │
                 │ & Reports       │
                 └─────────────────┘
```

Potential capstone capabilities include:

* Text understanding
* Image understanding
* Web crawling
* LLM-powered analysis
* Automated report generation
* PDF processing
* Background jobs
* Scheduled tasks
* Analytics dashboards
* Secure multi-user APIs
* AI audit logging

---

# 🤝 FlyRank Contributors & How to Contribute

We welcome contributions to **FlyRank**!

Whether you are:

* Fixing documentation
* Adding unit tests
* Improving Node.js implementations
* Improving Python implementations
* Adding examples
* Improving setup scripts
* Fixing bugs
* Adding new training modules

your contribution helps improve the FlyRank ecosystem.

## 👥 Contributors

Thank you to everyone contributing to FlyRank!

<a href="https://github.com/FlyRank/FlyRank/graphs/contributors">
  <img src="https://internship.flyrank.ai/assets/flyrank-wordmark-onLight.svg" alt="Contributors" />
</a>

### Core Contributors

* **FlyRank Team & Core Maintainers** (`@FlyRank`)
* **Open Source Community Contributors**

---

# 📝 Contribution Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/FlyRank.git
cd FlyRank
```

### 2. Create a Feature Branch

For new features:

```bash
git checkout -b feature/module-3-tests
```

For bug fixes:

```bash
git checkout -b fix/module-5-scraper-bug
```

### 3. Follow Coding Standards

* Write clean, maintainable code.
* Follow the architecture defined by the module.
* Maintain Node.js and Python support where applicable.
* Add tests for new functionality.
* Document important implementation decisions.
* Verify shell commands and code examples.

### 4. Commit Changes

Follow conventional commit messages:

```bash
git commit -m "feat: add AI generation endpoint"
```

Other examples:

```bash
git commit -m "fix: handle expired JWT tokens"
git commit -m "docs: add SQLite migration guide"
git commit -m "test: add task service unit tests"
```

### 5. Push Your Branch

```bash
git push origin feature/module-3-tests
```

### 6. Open a Pull Request

Submit a Pull Request against the `main` branch.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for complete contribution guidelines.

---

# 📄 License

This repository is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by the <b>FlyRank</b> Team & Community.
  <br />
  <b>Build. Learn. Ship. Scale.</b>
</p>
