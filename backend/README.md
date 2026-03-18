# Backend (Flask API)

## Overview

This directory contains the backend application built using **Flask**.

The backend acts as an interface between the frontend and the PostgreSQL database.

---

# Responsibilities

* handle user authentication
* expose API endpoints
* connect to PostgreSQL
* execute database queries
* enforce business logic

---

# Key Design

The backend connects to PostgreSQL using **user-specific credentials**:

```python
connect(user=username, password=password)
```

This allows:

* RBAC and RLS to be enforced directly by the database
* no need to implement access control logic in the backend

---

# Structure

```text
routes/     → API endpoints
services/   → business logic
db/         → database connection
utils/      → helper functions
```

---

# Planned Endpoints

* POST /login
* GET /orders
* GET /inventory
* GET /payments

---

# Setup (to be implemented)

1. Create virtual environment
2. Install dependencies
3. Configure `.env`
4. Run:

```bash
python run.py
```
