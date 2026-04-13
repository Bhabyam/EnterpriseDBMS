from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

returns_bp = Blueprint("returns", __name__, url_prefix="/api/returns")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

# 🔹 1. RETURN HISTORY
@returns_bp.route("/", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Cashier")
def get_returns():

    if request.method == "OPTIONS":
        return success([])

    user = get_current_user()

    try:
        if user["role"] == "Admin":
            sql = """
                SELECT 
                    r.return_id,
                    r.order_id,
                    c.first_name || ' ' || c.last_name AS customer_name,
                    b.branch_name,
                    r.reason,
                    r.return_date,
                    COALESCE(SUM(ri.refund_amount),0) AS refund_amount
                FROM return_orders r
                JOIN orders o ON r.order_id = o.order_id
                JOIN customers c ON o.customer_id = c.customer_id
                JOIN branches b ON o.branch_id = b.branch_id
                LEFT JOIN return_items ri ON r.return_id = ri.return_id
                GROUP BY 
                    r.return_id,
                    r.order_id,
                    customer_name,
                    b.branch_name,
                    r.reason,
                    r.return_date
                ORDER BY r.return_id DESC
            """
        else:
            sql = """
                SELECT 
                    r.return_id,
                    r.order_id,
                    c.first_name || ' ' || c.last_name AS customer_name,
                    r.reason,
                    r.return_date,
                    COALESCE(SUM(ri.refund_amount),0) AS refund_amount
                FROM return_orders r
                JOIN orders o ON r.order_id = o.order_id
                JOIN customers c ON o.customer_id = c.customer_id
                LEFT JOIN return_items ri ON r.return_id = ri.return_id
                GROUP BY 
                    r.return_id,
                    r.order_id,
                    customer_name,
                    r.reason,
                    r.return_date
                ORDER BY r.return_id DESC
            """

        rows = query(sql, fetchall=True, **c(user))

        return success([dict(r) for r in rows])

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)

# 🔹 2. RETURN DETAILS
@returns_bp.route("/<int:return_id>", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Cashier")
def get_return_details(return_id):

    if request.method == "OPTIONS":
        return success({})

    try:

        items = query(
            """
            SELECT 
                p.name AS product_name,
                ri.quantity,
                ri.item_condition,
                ri.refund_amount
            FROM return_items ri
            JOIN products p ON ri.product_id = p.product_id
            WHERE ri.return_id = %s
            """,
            (return_id,),
            fetchall=True
        )

        summary = query(
            """
            SELECT 
                r.return_id,
                r.order_id,
                r.reason,
                r.return_date,
                COALESCE(SUM(ri.refund_amount),0) AS total_refund
            FROM return_orders r
            LEFT JOIN return_items ri ON r.return_id = ri.return_id
            WHERE r.return_id = %s
            GROUP BY 
                r.return_id,
                r.order_id,
                r.reason,
                r.return_date
            """,
            (return_id,),
            fetchone=True
        )

        return success({
            "items": items or [],
            "summary": summary or {}
        })

    except Exception as e:
        return error(str(e))