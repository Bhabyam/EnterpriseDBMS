CREATE ROLE admin_role;
CREATE ROLE manager_role;
CREATE ROLE sales_exec_role;
CREATE ROLE inventory_staff_role;
CREATE ROLE cashier_role;
CREATE ROLE support_staff_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON products, orders, accomodates, customers
TO manager_role;

GRANT SELECT ON products, customers, orders TO sales_exec_role;
GRANT INSERT ON orders, customers TO sales_exec_role;
GRANT UPDATE ON orders TO sales_exec_role;

GRANT SELECT ON products, accomodates TO inventory_staff_role;
GRANT INSERT, UPDATE ON accomodates, stock_movements TO inventory_staff_role;

GRANT SELECT ON products, customers TO cashier_role;
GRANT INSERT ON orders, payments TO cashier_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO support_staff_role;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomodates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;


SELECT 'CREATE ROLE ' || username || 
       ' LOGIN PASSWORD ''' || username || ''';'
FROM users;
\gexec

SELECT 'GRANT admin_role TO ' || username || ';'
FROM users
WHERE role_id = 1;
\gexec

SELECT 'GRANT manager_role TO ' || username || ';'
FROM users
WHERE role_id = 2;
\gexec

SELECT 'GRANT sales_exec_role TO ' || username || ';'
FROM users
WHERE role_id = 3;
\gexec

SELECT 'GRANT inventory_staff_role TO ' || username || ';'
FROM users
WHERE role_id = 4;
\gexec

SELECT 'GRANT cashier_role TO ' || username || ';'
FROM users
WHERE role_id = 5;
\gexec

SELECT 'GRANT support_staff_role TO ' || username || ';'
FROM users
WHERE role_id = 6;
\gexec