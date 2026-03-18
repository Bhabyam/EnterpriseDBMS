# Multi-Branch Retail Management System

## Overview

This project implements a **full-stack retail management system** designed for a multi-branch retail organization.

It includes:

* a **PostgreSQL database** with advanced security (RBAC + RLS)
* a **Flask backend API** for handling application logic
* a **React frontend** for user interaction

The system models real-world retail operations such as inventory management, order processing, payments, and inter-branch stock transfers.

---

# Key Features

* Multi-branch retail architecture
* Role-Based Access Control (RBAC)
* Row Level Security (RLS) for branch isolation
* Inventory tracking across branches
* Order and payment management
* Inter-branch stock transfers

---

# System Architecture

```text
React Frontend
        ↓
Flask Backend API
        ↓
PostgreSQL Database (RBAC + RLS)
```

---

# Project Structure

```text
backend/    → API layer (Flask)
frontend/   → UI layer (React)
database/   → SQL, data, and schema
```

---

# Setup

Refer to individual folders:

* `database/README.md` → database setup
* `backend/README.md` → backend setup
* `frontend/README.md` → frontend setup

---

# Highlights

This system uses **PostgreSQL Row Level Security with per-user database connections**, ensuring that access control is enforced directly at the database level rather than the application layer.

---

# Project Context

Developed as part of a **Database Management Systems course**, focusing on building a secure and scalable real-world database system.
