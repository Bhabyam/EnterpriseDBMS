CREATE POLICY branch_orders_policy
ON orders
FOR ALL
TO manager_role, sales_exec_role, cashier_role
USING (
    branch_id = (
        SELECT branch_id
        FROM users
        WHERE username = current_user
    )
);

CREATE POLICY admin_orders_policy
ON orders
FOR ALL
TO admin_role
USING (true);

CREATE POLICY branch_inventory_policy
ON accomodates
FOR ALL
TO manager_role, inventory_staff_role
USING (
    branch_id = (
        SELECT branch_id
        FROM users
        WHERE username = current_user
    )
);

CREATE POLICY admin_inventory_policy
ON accomodates
FOR ALL
TO admin_role
USING (true);

CREATE POLICY branch_stock_policy
ON stock_movements
FOR ALL
TO inventory_staff_role, manager_role
USING (
    from_branch_id = (
        SELECT users.branch_id
        FROM users
        WHERE users.username = current_user
    )
    OR
    to_branch_id = (
        SELECT users.branch_id
        FROM users
        WHERE users.username = current_user
    )
);

CREATE POLICY admin_stock_policy
ON stock_movements
FOR ALL
TO admin_role
USING (true);

CREATE POLICY branch_payments_policy
ON payments
FOR ALL
TO cashier_role, manager_role
USING (
    order_id IN (
        SELECT o.order_id
        FROM orders o
        WHERE o.branch_id = (
            SELECT branch_id
            FROM users
            WHERE username = current_user
        )
    )
);

CREATE POLICY admin_payments_policy
ON payments
FOR ALL
TO admin_role
USING (true);
