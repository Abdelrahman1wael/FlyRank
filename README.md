# 🚀 FlyRank — Full-Stack & AI Engineering Training Program

Welcome to **FlyRank**, a comprehensive, production-grade training and internship repository designed to take engineers from backend fundamentals to full-stack, distributed background job systems, LLM endpoints, web scrapers, and AI vision capstones.

---

## 📖 Table of Contents

<details open>
<summary><b>Click to Expand / Collapse Table of Contents</b></summary>

1. [About FlyRank](#-about-flyrank)
2. [Curriculum Overview & Assignments](#-curriculum-overview--assignments)
   - [Module 1: Task CRUD API (In-Memory REST API)](#module-1-task-crud-api-in-memory-rest-api)
   - [Module 2: Task Management API with SQLite](#module-2-task-management-api-with-sqlite)
   - [Module 3: Full-Stack Task API with Postgres & Docker](#module-3-full-stack-task-api-with-postgres--docker)
   - [Module 4: Supabase Auth Gateway (JWT Authentication)](#module-4-supabase-auth-gateway-jwt-authentication)
   - [Module 5: Idempotent Web Scraper Data Pipeline](#module-5-idempotent-web-scraper-data-pipeline)
   - [Module 6: Production-Grade LLM Classification Endpoint](#module-6-production-grade-llm-classification-endpoint)
   - [Module 7: Automated PDF Report Generator Pipeline](#module-7-automated-pdf-report-generator-pipeline)
   - [Module 8: Asynchronous Background Job System (Inngest)](#module-8-asynchronous-background-job-system-inngest)
   - [Graduation: AI Image Understanding & Content Matching Engine](#graduation-ai-image-understanding--content-matching-engine)
3. [Quick Start & Bash Environment Setup](#-quick-start--bash-environment-setup)
   - [Automated Setup Script (`setup.sh`)](#automated-setup-script-setupsh)
   - [Manual Prerequisites](#manual-prerequisites)
4. [Bash Commands Reference](#-bash-commands-reference)
   - [Running Node.js Express Modules](#running-nodejs-express-modules)
   - [Running Python FastAPI Modules](#running-python-fastapi-modules)
   - [cURL Testing & Verification Commands](#curl-testing--verification-commands)
   - [Docker & Database Commands](#docker--database-commands)
5. [Repository Structure](#-repository-structure)
6. [FlyRank Contributors & How to Contribute](#-flyrank-contributors--how-to-contribute)
7. [License](#-license)

</details>

---

## 🎯 About FlyRank

**FlyRank** is built around an engineering-first hands-on methodology:
- **Dual-Track Learning**: Choose between **Node.js (Express)** or **Python (FastAPI)** for backend API modules.
- **Production Mindset**: Move step-by-step from in-memory primitives $\rightarrow$ SQLite $\rightarrow$ Postgres + Docker $\rightarrow$ JWT Bearer Gateways $\rightarrow$ Web Scraping $\rightarrow$ LLMs $\rightarrow$ Automated PDF Pipelines $\rightarrow$ Distributed Cron & Async Queues.
- **Graduation Capstone**: Complete a full-scale AI Multimodal Engine integrating visual understanding, web crawling, and automated analytics.

---

## 📚 Curriculum Overview & Assignments

Below is the complete module roadmap. Click on any module title to access its full build guide and sub-repository.

### [Module 1: Task CRUD API (In-Memory REST API)](1/README.md)
- **Folder**: [`/1`](1/README.md) | **Build Guide**: [`Task-API-Full-Build-Guide.md`](1/Task-API-Full-Build-Guide.md)
- **Summary**: Build your first RESTful HTTP server from scratch. Implement CRUD endpoints for tasks, set up CORS, configure Swagger documentation (`swagger-ui-express` / FastAPI docs), and wire up a frontend interface.
- **Tech Stack**: Express (Port 3000) or FastAPI (Port 8000), Swagger UI, React/Vanilla JS.

### [Module 2: Task Management API with SQLite](2/README.md)
- **Folder**: [`/2`](2/README.md) | **Build Guide**: [`SQLite_Task_API_Complete_Guide.md`](2/SQLite_Task_API_Complete_Guide.md)
- **Summary**: Transition from volatile in-memory state to persistent disk storage using SQLite. Implement table initialization, auto-increment primary keys, dynamic SQL queries, and parameter sanitization to prevent SQL injection.
- **Tech Stack**: SQLite3 (`better-sqlite3` for Node / `sqlite3` for Python).

### [Module 3: Full-Stack Task API with Postgres & Docker](3/README.md)
- **Folder**: [`/3`](3/README.md) | **Build Guide**: [`full-stack-task-api-guide.md`](3/full-stack-task-api-guide.md)
- **Summary**: Graduate to production-grade Relational Database Management Systems. Containerize PostgreSQL with `docker-compose`, write migration scripts, handle connection pooling, and integrate foreign keys.
- **Tech Stack**: PostgreSQL, Docker, Docker Compose, `pg` / `psycopg2` / `asyncpg`.

### [Module 4: Supabase Auth Gateway (JWT Authentication)](4/README.md)
- **Folder**: [`/4`](4/README.md) | **Build Guide**: [`Supabase_Auth_Gateway_Guide.md`](4/Supabase_Auth_Gateway_Guide.md)
- **Summary**: Secure your REST API with JWT Bearer tokens and Supabase Auth. Build `/auth/signup`, `/auth/login`, public info routes, and auth-protected endpoints (`/protected/profile`, `/protected/dashboard`).
- **Tech Stack**: Supabase Auth SDK, Express Middleware / FastAPI Dependencies, Bearer JWT validation.

### [Module 5: Idempotent Web Scraper Data Pipeline](5/README.md)
- **Folder**: [`/5`](5/README.md) | **Build Guide**: [`scraper-internship-guide.md`](5/scraper-internship-guide.md)
- **Summary**: Build an enterprise data extraction pipeline against sandbox target `toscrape.com`. Implement HTML disk-caching, selector extraction, schema validation, error resilience, and idempotency guarantees.
- **Tech Stack**: Node.js (`axios`, `cheerio`) or Python (`requests`, `beautifulsoup4`), JSON schema validation.

### [Module 6: Production-Grade LLM Classification Endpoint](6/README.md)
- **Folder**: [`/6`](6/README.md) | **Build Guide**: [`LLM-Endpoint-Build-Guide.md`](6/LLM-Endpoint-Build-Guide.md)
- **Summary**: Design structured AI model endpoints. Write strict prompt specifications, guarantee pure JSON outputs (no markdown wrapping or conversational filler), enforce fallback defaults, and abstract LLM provider calls (OpenRouter / Ollama).
- **Tech Stack**: OpenRouter API / Ollama local LLM, Zod / Pydantic schema verification.

### [Module 7: Automated PDF Report Generator Pipeline](7/README.md)
- **Folder**: [`/7`](7/README.md) | **Build Guide**: [`Automated_PDF_Report_Generator_Pipeline.md`](7/Automated_PDF_Report_Generator_Pipeline.md)
- **Summary**: Create an automated reporting service. Aggregate database numbers with SQL queries, format clean responsive HTML templates, render crisp PDF files using headless Chromium (Playwright), and implement daily idempotency caching.
- **Tech Stack**: FastAPI / Express, SQLite aggregation, Playwright (Chromium HTML-to-PDF).

### [Module 8: Asynchronous Background Job System (Inngest)](8/README.md)
- **Folder**: [`/8`](8/README.md) | **Build Guide**: [`build-guide.md`](8/build-guide.md)
- **Summary**: Shift slow tasks off the main web thread. Wire up Inngest background workers for async processing, retry handling on failure, fan-out event workflows, and cron-scheduled jobs.
- **Tech Stack**: Express / FastAPI, Inngest SDK & CLI.

### [Graduation: AI Image Understanding & Content Matching Engine](Graduation/README.md)
- **Folder**: [`/Graduation`](Graduation/README.md) | **Specs**: 17 Detailed Capstone Guides
- **Summary**: Final Capstone Project combining all 8 modules into a production system. Features visual prompt parsing, web content matching, automated report generation, and distributed task queue processing.

---

## 🛠️ Quick Start & Bash Environment Setup

### Automated Setup Script (`setup.sh`)

FlyRank includes a unified Bash script [`setup.sh`](setup.sh) to inspect dependencies, configure environment variables, and launch any assignment module:

```bash
# Make the setup script executable
chmod +x setup.sh

# Run interactive environment check and launcher
./setup.sh
```

### Manual Prerequisites

Ensure you have the following installed on your workstation:
- **Node.js**: `v18.0.0` or higher (`node -v`)
- **Python**: `v3.10` or higher (`python3 --version`)
- **Docker & Docker Compose**: (`docker --version`, `docker compose version`)
- **Git**: (`git --version`)

---

## 💻 Bash Commands Reference

Here is a handy cheat sheet of shell commands for working with all FlyRank training assignments.

### Running Node.js Express Modules

```bash
# Module 1: In-Memory Task API
cd 1 && npm install && npm start

# Module 2: SQLite Task API
cd 2 && npm install && node server.js

# Module 3: Full-Stack Postgres App
cd 3 && npm install && npm run dev

# Module 4: Supabase Auth Gateway
cd 4 && npm install && npm run dev
```

### Running Python FastAPI Modules

```bash
# Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements for Python modules
pip install fastapi uvicorn requests sqlite3 pydantic

# Run FastAPI modules with auto-reload on port 8000
uvicorn main:app --reload --port 8000
```

### cURL Testing & Verification Commands

```bash
# Test GET tasks list
curl -X GET http://localhost:3000/tasks

# Test POST create task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Complete FlyRank Module 1", "done": false}'

# Test Protected Route with JWT Bearer Token
curl -X GET http://localhost:3000/protected/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

### Docker & Database Commands

```bash
# Launch PostgreSQL container for Module 3
cd 3 && docker-compose up -d

# Stop PostgreSQL container
cd 3 && docker-compose down -v

# Connect to local Postgres instance via psql
docker exec -it flyrank_postgres psql -U postgres -d taskdb
```

---

## 📂 Repository Structure

```
FlyRank/
├── README.md                           # Master Documentation (This file)
├── CONTRIBUTING.md                     # Contributor Guidelines & Code Standards
├── setup.sh                            # Universal Bash Setup & Environment Script
├── 1/                                  # Module 1: Task CRUD API
│   ├── README.md                       # Module 1 Specific Guide & Bash Commands
│   └── Task-API-Full-Build-Guide.md
├── 2/                                  # Module 2: SQLite Task API
│   ├── README.md                       # Module 2 Specific Guide & Bash Commands
│   └── SQLite_Task_API_Complete_Guide.md
├── 3/                                  # Module 3: Full-Stack Postgres API
│   ├── README.md                       # Module 3 Specific Guide & Bash Commands
│   └── full-stack-task-api-guide.md
├── 4/                                  # Module 4: Supabase Auth Gateway
│   ├── README.md                       # Module 4 Specific Guide & Bash Commands
│   └── Supabase_Auth_Gateway_Guide.md
├── 5/                                  # Module 5: Idempotent Web Scraper
│   ├── README.md                       # Module 5 Specific Guide & Bash Commands
│   └── scraper-internship-guide.md
├── 6/                                  # Module 6: LLM Classification Endpoint
│   ├── README.md                       # Module 6 Specific Guide & Bash Commands
│   └── LLM-Endpoint-Build-Guide.md
├── 7/                                  # Module 7: Automated PDF Generator
│   ├── README.md                       # Module 7 Specific Guide & Bash Commands
│   └── Automated_PDF_Report_Generator_Pipeline.md
├── 8/                                  # Module 8: Asynchronous Background Jobs
│   ├── README.md                       # Module 8 Specific Guide & Bash Commands
│   └── build-guide.md
└── Graduation/                         # Graduation Capstone Project Specs
    ├── README.md                       # Capstone Overview & Phase Checklist
    └── *.pdf                           # 17 Architectural & Evaluation PDFs
```

---

## 🤝 FlyRank Contributors & How to Contribute

We welcome contributions to **FlyRank**! Whether you are fixing a typo in a build guide, adding unit tests for a module, improving Python/Node code snippets, or enhancing setup scripts, your contributions make FlyRank better for everyone.

### 👥 Contributors

Thank you to all who have contributed to the FlyRank ecosystem!

<a href="https://github.com/FlyRank/FlyRank/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=FlyRank/FlyRank" alt="Contributors" />
</a>

*(If you are contributing locally, add your name and handle to the list below!)*
- **FlyRank Team & Core Maintainers** (`@FlyRank`)
- **Open Source Community Contributors**

### 📝 Contribution Workflow

1. **Fork & Clone**: Fork the repository and clone it to your machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/FlyRank.git
   cd FlyRank
   ```
2. **Branching**: Create a feature branch following our naming convention:
   ```bash
   git checkout -b feature/module-3-tests  # for new features
   git checkout -b fix/module-5-scraper-bug  # for bug fixes
   ```
3. **Coding Standards**:
   - Write clean, well-commented code.
   - Maintain dual Node.js and Python support where applicable.
   - Verify all bash code snippets execute cleanly.
4. **Commit Conventions**:
   ```bash
   git commit -m "docs: add collapsible TOC and bash commands to Module 4"
   ```
5. **Pull Request**: Push to your fork and submit a PR to the `main` branch. See full guidelines in [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## 📄 License

This repository is licensed under the **MIT License**. See the `LICENSE` file for details.

---

<p align="center">
Made with ❤️ by the <b>FlyRank</b> Team & Community. Happy Coding!
</p>
