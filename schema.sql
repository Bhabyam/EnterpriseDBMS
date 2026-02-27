-- ===============================
-- MASTER TABLES
-- ===============================

CREATE TABLE branches (
    branch_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_name VARCHAR(50) NOT NULL,
    location VARCHAR(150),
    warehouse_address VARCHAR(200)
);

CREATE TABLE categories (
    category_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    description VARCHAR(100)
);

CREATE TABLE brands (
    brand_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL
);

CREATE TABLE units (
    unit_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unit_name VARCHAR(50) NOT NULL,
    symbol VARCHAR(20)
);

CREATE TABLE suppliers (
    supplier_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(50),
    phone VARCHAR(50),
    address VARCHAR(150),
    gst_number VARCHAR(50)
);

CREATE TABLE customers (
    customer_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(50),
    address VARCHAR(150),
    customer_type VARCHAR(50)
);

CREATE TABLE roles (
    role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    permission_level INT
);

-- ===============================
-- PRODUCTS
-- ===============================

CREATE TABLE products (
    product_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category_id INT NOT NULL REFERENCES categories(category_id),
    brand_id INT NOT NULL REFERENCES brands(brand_id),
    unit_id INT NOT NULL REFERENCES units(unit_id),
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    gst NUMERIC(5,2) CHECK (gst >= 0),
    cost_price NUMERIC(10,2) NOT NULL CHECK (cost_price > 0),
    description VARCHAR(100)
);

-- ===============================
-- EMPLOYEES & USERS
-- ===============================

CREATE TABLE employees (
    employee_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    position VARCHAR(50),
    phone VARCHAR(15),
    email VARCHAR(50),
    salary BIGINT,
    branch_id INT NOT NULL REFERENCES branches(branch_id)
);

CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id)
);

CREATE TABLE user_sessions (
    session_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    device_info VARCHAR(100)
);

-- ===============================
-- INVENTORY
-- ===============================

CREATE TABLE accomodates (
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (branch_id, product_id)
);

CREATE TABLE stock_movements (
    movement_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    from_branch_id INT NOT NULL REFERENCES branches(branch_id),
    to_branch_id INT NOT NULL REFERENCES branches(branch_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100),
    CHECK (from_branch_id != to_branch_id)
);

-- ===============================
-- ORDERS
-- ===============================

CREATE TABLE orders (
    order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN 
        ('Pending','Confirmed','Shipped','Delivered','Cancelled')),
    total_amount NUMERIC(10,2),
    invoice_number VARCHAR(30) UNIQUE,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id)
);

CREATE TABLE order_items (
    order_item_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    discount NUMERIC(5,2) DEFAULT 0 CHECK (discount >= 0),
    sub_total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * price * (100-discount) * 0.01)
);

CREATE TABLE payments (
    payment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- PURCHASES
-- ===============================

CREATE TABLE purchase_orders (
    po_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_date TIMESTAMP,
    status VARCHAR(20) CHECK (status IN 
        ('Pending','Confirmed','Shipped','Delivered','Cancelled'))
);

CREATE TABLE purchase_items (
    p_item_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    po_id INT NOT NULL REFERENCES purchase_orders(po_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(10,2) NOT NULL CHECK (cost_price > 0),
    sub_total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * cost_price)
);

-- Supplier capability table (M:N relationship)

CREATE TABLE supplies (
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    PRIMARY KEY (supplier_id, product_id)
);

-- ===============================
-- RETURNS
-- ===============================

CREATE TABLE return_orders (
    return_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id),
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100)
);

CREATE TABLE return_items (
    return_item_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    return_id INT NOT NULL REFERENCES return_orders(return_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    item_condition VARCHAR(20) CHECK (item_condition IN ('Unused','Damaged','Opened')),
    refund_amount NUMERIC(10,2) NOT NULL CHECK (refund_amount >= 0)
);

-- ===============================
-- EXPENSES
-- ===============================

CREATE TABLE expenses (
    expense_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(100)
);