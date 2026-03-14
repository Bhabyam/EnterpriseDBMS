<!-- # EnterpriseDBMS -->
# Multi-Branch Retail Management Database

## Overview

This project implements a **PostgreSQL database system for managing a multi-branch retail organization**.

The database models real retail operations including:

* product inventory management
* customer orders
* payment tracking
* inter-branch stock transfers
* employee access control

The system simulates a retail company operating **multiple branches with employees assigned to different operational roles**.

The primary focus of the project is implementing a **secure, scalable relational database architecture** using advanced PostgreSQL features.

Key design concepts implemented in the system include:

* Role-Based Access Control (RBAC)
* Row Level Security (RLS)
* Branch-level data isolation
* Secure role-based authentication
* Normalized relational schema design

---

# Key Features

### Multi-Branch Retail Architecture

The database supports multiple branches operating independently while sharing centralized product and operational data.

### Role-Based Access Control

Employees are assigned predefined roles such as administrators, managers, sales executives, inventory staff, cashiers, and support staff.
Permissions are managed through PostgreSQL role groups.

### Row Level Security

Branch-level isolation is enforced using PostgreSQL Row Level Security policies, ensuring employees can only access data associated with their branch.

### Inventory Management

Inventory is tracked per branch, allowing the system to manage stock levels and support transfers of products between branches.

### Transaction Tracking

Customer orders and payments are stored and linked, allowing accurate tracking of retail transactions.

---

# System Architecture

The system is designed using a **three-layer architecture** separating presentation, application logic, and data storage.

```text
Frontend (React)
        ↓
Backend API (Flask)
        ↓
PostgreSQL Database
```

### Frontend (React)

The frontend provides the **user interface for employees** interacting with the system.

Planned features include:

* employee login interface
* branch dashboard
* order management interface
* inventory monitoring
* payment processing interface
* branch activity views

React is chosen because it provides:

* fast component-based UI development
* strong ecosystem for building dashboards
* easy integration with REST APIs

### Backend (Flask)

The backend application is planned to be implemented using **Flask**.

The backend will handle:

* authentication and login logic
* API endpoints for frontend requests
* communication with the PostgreSQL database
* enforcement of business logic
* secure database queries

Flask is chosen because:

* it is lightweight and easy to integrate with PostgreSQL
* it works well for REST API development
* it is simple to prototype quickly for academic projects

### Database (PostgreSQL)

The PostgreSQL database serves as the **core data layer**, responsible for:

* storing relational data
* enforcing RBAC permissions
* enforcing row-level security
* maintaining transactional integrity
* managing inventory and transaction data

---

# Security Model

The database implements a layered security architecture.

### Login Roles

Each employee is represented by an individual PostgreSQL login role.

### Group Roles

Permissions are assigned through predefined role groups representing job responsibilities.

Examples include:

* `admin_role`
* `manager_role`
* `sales_exec_role`
* `inventory_staff_role`
* `cashier_role`
* `support_staff_role`

Employees inherit permissions by being granted membership in these group roles.

### Permission Grants

Database privileges such as `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are granted to role groups based on operational responsibilities.

### Row Level Security Policies

Row Level Security (RLS) policies enforce **branch-level data isolation**, ensuring that employees can only access records belonging to their branch.

For example:

* managers see only their branch orders
* inventory staff see only their branch stock
* administrators can access data from all branches

---

# Technologies Used

| Component               | Technology            |
| ----------------------- | --------------------- |
| Database                | PostgreSQL            |
| Database Administration | pgAdmin               |
| Backend                 | Flask (Python)        |
| Frontend                | React                 |
| Query Language          | SQL                   |
| Security                | PostgreSQL RBAC + RLS |

---

# Project Structure

```
project/
│
├── retail_db.tar       # complete PostgreSQL database dump
├── schema.sql          # schema definition for tables
├── roles.sql           # role creation and permission configuration
├── policies.sql        # row level security policies
│
├── data/               # CSV datasets used to populate tables
│   ├── products.csv
│   ├── users.csv
│   ├── orders.csv
│   ├── payments.csv
│   ├── accomodates.csv
│   └── stock_movements.csv
│
└── README.md
```

---

# Database Setup

The database can be initialized in **two different ways**.

---

# Option 1 — Restore the Preconfigured Database (Recommended)

The repository includes a **PostgreSQL database dump (`retail_db.tar`)** that already contains:

* all tables
* populated data
* RBAC role configuration
* Row Level Security policies

This allows the entire system to be restored quickly.

### Steps

1. Create a PostgreSQL database.

2. Restore the dump using:

```bash
pg_restore -U postgres -d dbms_project retail_db.tar
```

After restoration, the database will already contain all schema objects, data, roles, and security policies.

---

# Option 2 — Rebuild the Database from SQL Files

The database can also be recreated manually.

### Steps

1. Create a PostgreSQL database.

2. Run the schema file:

```
schema.sql
```

3. Configure database roles and permissions:

```
roles.sql
```

4. Apply Row Level Security policies:

```
policies.sql
```

5. Import the dataset from CSV files located in the `data/` directory.

Example:

```sql
COPY products FROM 'data/products.csv' CSV HEADER;
```

Repeat the import process for the remaining tables.

---

# Security Implementation Summary

The database security architecture combines multiple mechanisms:

* individual login roles for employees
* role groups defining operational permissions
* permission grants restricting database operations
* row-level security policies enforcing branch isolation

This ensures that employees only interact with data relevant to their responsibilities and branch assignment.

---

# Development Plan

The project is being developed in stages:

1. **Database Design**

   * relational schema creation
   * data population
   * RBAC implementation
   * row-level security policies

2. **Backend Development**

   * REST API using Flask
   * authentication endpoints
   * database interaction layer

3. **Frontend Development**

   * React-based dashboard
   * inventory and order management interfaces
   * role-specific UI views

---

# Project Context

This project was developed as part of a **Database Management Systems course**.

The goal is to design and implement a **secure, scalable relational database system for a multi-branch retail environment**, demonstrating real-world database architecture and access control using PostgreSQL.
