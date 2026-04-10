from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

@payments_bp.route("/", methods=["GET"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Cashier")
def get_all_payments():
    if request.method == "OPTIONS":
        return success([])

    user = get_current_user()

    try:
        if user["role"] == "Admin":
            sql = """
                SELECT 
                    p.payment_id,
                    p.order_id,
                    p.amount,
                    p.payment_method,
                    p.transaction_id,
                    p.payment_date,
                    b.branch_name
                FROM payments p
                JOIN orders o ON p.order_id = o.order_id
                JOIN branches b ON o.branch_id = b.branch_id
                ORDER BY p.payment_date DESC
            """

        else:
            sql = """
                SELECT 
                    p.payment_id,
                    p.order_id,
                    p.amount,
                    p.payment_method,
                    p.transaction_id,
                    p.payment_date
                FROM payments p
                JOIN orders o ON p.order_id = o.order_id
                ORDER BY p.payment_date DESC
            """

        rows = query(sql, fetchall=True, **c(user))
        return success([dict(r) for r in rows])

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)