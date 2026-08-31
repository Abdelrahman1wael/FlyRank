# Supabase Integration & Synchronization Guide

This document explains how updates in the **FlyRank Express API Gateway** sync with and reflect in your **Supabase Project**.

---

## 1. Data Flow Architecture

```
+--------------------------+       Supabase JS SDK       +-------------------------------+
|  Express API Gateway     |  ------------------------>  |  Supabase Project (Cloud)     |
|  (http://localhost:3000) |  <------------------------  |  (https://punjtqqkea...co)   |
+--------------------------+                             +-------------------------------+
            |                                                           |
  Endpoint Operations                                           Cloud Infrastructure
  - POST /auth/signup   ------->  supabase.auth.signUp()  ------>  Auth.users Table
  - POST /auth/login    ------->  signInWithPassword()   ------>  JWT Session Manager
  - POST /auth/logout   ------->  admin.signOut()        ------->  Token Revocation
  - Protected Routes    ------->  auth.getUser(token)    ------->  Auth Validation
```

---

## 2. Real-Time Data Synchronization

### Authentication & Users
- **Signup (`/auth/signup`)**: When a user registers through your local server, the Supabase Auth engine immediately creates a user record in your cloud project.
- **Login (`/auth/login`)**: Returns a signed JWT token directly issued by Supabase Auth.
- **Viewing Users**: Open your **[Supabase Dashboard](https://supabase.com/dashboard)** ➔ Select Project ➔ **Authentication** ➔ **Users**.

### Database Operations (PostgreSQL)
- Any database queries using `supabase.from('table_name')` run directly against your hosted PostgreSQL instance on Supabase.
- Table edits, insertions, or updates in code immediately reflect under **Table Editor** in the Supabase Dashboard.

---

## 3. Recommended Supabase Project Settings

To ensure local testing works seamlessly with your server endpoints:

1. **Disable Email Confirmation (for direct API testing)**:
   - Dashboard path: `Authentication` ➔ `Providers` ➔ `Email`
   - Uncheck **Confirm email** to allow instant logins after signup.

2. **JWT & API Keys**:
   - Environment variables in `.env`:
     - `SUPABASE_URL`: Links your API to the exact cloud project URL.
     - `SUPABASE_ANON_KEY`: Grants client-level public permissions subject to Row Level Security (RLS).

---

## 4. Managing Schema & Environment Updates

- **Local Code Updates**: Modifying routes or middleware in `server.js` alters local server behavior and validation.
- **Database Schema Updates**: Use the Supabase **SQL Editor** or **Supabase CLI** (`npx supabase db push`) to manage database migrations cleanly.
