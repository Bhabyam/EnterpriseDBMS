# Database Layer

## Overview

This directory contains the complete PostgreSQL database implementation for the retail management system.

The database is designed to support:

* multi-branch operations
* role-based access control
* secure data isolation using row-level security

---

# Features

* Normalized relational schema
* Role-Based Access Control (RBAC) using PostgreSQL roles
* Row Level Security (RLS) for branch isolation
* Realistic dataset simulating retail operations
* Inter-branch stock movement tracking

---

# Database Dump (Recommended Setup)

The file `retail_db.tar` contains:

* complete schema
* populated data
* RLS policies

### Restore using:

```bash
pg_restore -U postgres -d dbms_project retail_db.tar
```

Configure roles:

```
roles.sql
```

Apply policies:

```
policies.sql
```

---

# Alternative Setup (Manual)

1. Run:

```
schema.sql
```

2. Configure roles:

```
roles.sql
```

3. Apply policies:

```
policies.sql
```

4. Import CSV data from `data/`

---

# Security Design

The database enforces security using:

* PostgreSQL login roles for each user
* group roles for permission management
* row-level security policies for branch isolation

This ensures that users can only access data relevant to their role and assigned branch.

---

# Data

The dataset includes:

* multiple branches
* employees across roles
* products and inventory
* orders and payments
* stock transfers

All data is generated using structured CSV files.

---

# Visualizations

The `images/` folder contains:

* ER diagrams
* relational schema diagrams
