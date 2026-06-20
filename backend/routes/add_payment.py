from flask import Blueprint, request
from db import query, call_procedure
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

add_payment_bp = Blueprint("add_payment", __name__, url_prefix="/api/add_payment")

def c(user):
    return {
        "username": user.get("db_username"),
        "password": user.get("db_password"),
    }

@add_payment_bp.route("/orders", methods=["GET"])
@jwt_or_session_required
def get_payment_orders():
    user = get_current_user()
    branch_id = request.args.get("branch_id")
    try:
        rows = query(
            """
            SELECT o.order_id, o.invoice_number, c.first_name || ' ' || c.last_name as customer
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.branch_id = %s AND o.status != 'Delivered'
            ORDER BY o.order_id DESC
            """,
            (branch_id,), fetchall=True, **c(user)
        )
        return success([dict(r) for r in rows])
    except Exception as e:
        return error(str(e))

@add_payment_bp.route("/order/<int:order_id>", methods=["GET"])
@jwt_or_session_required
def get_order_balance(order_id):
    user = get_current_user()
    try:
        row = query(
            """
            SELECT 
                o.total_amount - COALESCE(SUM(p.amount), 0) as remaining
            FROM orders o
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.order_id = %s
            GROUP BY o.order_id, o.total_amount
            """,
            (order_id,), fetchone=True, **c(user)
        )
        if not row: return error("Order not found", 404)
        return success(dict(row))
    except Exception as e:
        return error(str(e))

@add_payment_bp.route("/", methods=["POST"])
@jwt_or_session_required
def process_payment():
    user = get_current_user()
    data = request.get_json()
    try:
        call_procedure(
            "add_payment",
            [int(data["order_id"]), float(data["amount"]), data["payment_method"]],
            **c(user)
        )
        res = query(
            "SELECT (total_amount - (SELECT COALESCE(SUM(amount),0) FROM payments WHERE order_id = %s)) as remaining FROM orders WHERE order_id = %s",
            (data["order_id"], data["order_id"]), fetchone=True, **c(user)
        )
        return success({
            "message": "Payment added successfully",
            "remaining": float(res['remaining'])
        })
    except Exception as e:
        msg = str(e)
        if hasattr(e, 'diag') and e.diag.message_primary: msg = e.diag.message_primary
        return error(msg, 400)