from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }


# ✅ GET ALL ORDERS
@orders_bp.route("/", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Cashier")
def get_orders():
    if request.method == "OPTIONS":
        return success([])

    user = get_current_user()

    try:
        if user["role"] == "Admin":
            sql = """
                SELECT 
                    o.order_id,
                    o.invoice_number,
                    c.first_name || ' ' || c.last_name AS customer,
                    b.branch_name,
                    o.order_date,
                    o.total_amount,
                    COALESCE(SUM(p.amount),0) AS paid,
                    o.total_amount - COALESCE(SUM(p.amount),0) AS remaining,
                    o.status
                FROM orders o
                JOIN customers c ON o.customer_id = c.customer_id
                JOIN branches b ON o.branch_id = b.branch_id
                LEFT JOIN payments p ON o.order_id = p.order_id
                GROUP BY 
                    o.order_id,
                    o.invoice_number,
                    customer,
                    b.branch_name,
                    o.order_date,
                    o.total_amount,
                    o.status
                ORDER BY o.order_id DESC
            """

        else:
            sql = """
                SELECT 
                    o.order_id,
                    o.invoice_number,
                    c.first_name || ' ' || c.last_name AS customer,
                    o.order_date,
                    o.total_amount,
                    COALESCE(SUM(p.amount),0) AS paid,
                    o.total_amount - COALESCE(SUM(p.amount),0) AS remaining,
                    o.status
                FROM orders o
                JOIN customers c ON o.customer_id = c.customer_id
                LEFT JOIN payments p ON o.order_id = p.order_id
                GROUP BY 
                    o.order_id,
                    o.invoice_number,
                    customer,
                    o.order_date,
                    o.total_amount,
                    o.status
                ORDER BY o.order_id DESC
            """

        rows = query(sql, fetchall=True, **c(user))
        return success([dict(r) for r in rows])

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)


# ✅ ORDER DETAILS
@orders_bp.route("/<int:order_id>", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Cashier")
def get_order_details(order_id):
    if request.method == "OPTIONS":
        return success({})

    try:
        items = query(
            """
            SELECT 
                p.name,
                oi.quantity,
                oi.price,
                oi.discount,
                oi.sub_total,
                p.product_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s
            """,
            (order_id,),
            fetchall=True
        )

        summary = query(
            """
            SELECT 
                o.invoice_number,
                o.total_amount,
                COALESCE(SUM(p.amount),0) AS paid,
                o.total_amount - COALESCE(SUM(p.amount),0) AS remaining,
                o.status,
                EXISTS(
                    SELECT 1
                    FROM return_orders r
                    WHERE r.order_id = o.order_id
                ) AS is_returned
            FROM orders o
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.order_id = %s
            GROUP BY o.order_id, o.invoice_number, o.total_amount, o.status
            """,
            (order_id,),
            fetchone=True
        )

        return success({
            "items": items,
            "summary": summary
        })

    except Exception as e:
        return error(str(e))