from flask import Blueprint, request
from db import query, call_procedure
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

add_purchase_payment_bp = Blueprint("add_purchase_payment", __name__, url_prefix="/api/add_purchase_payment")

def c(user):
    """Helper to pass user-specific DB credentials"""
    return {
        "username": user.get("db_username"),
        "password": user.get("db_password"),
    }

@add_purchase_payment_bp.route("/pos", methods=["GET"])
@jwt_or_session_required
def get_pending_pos():
    user = get_current_user()
    # Try to get branch_id from URL params, then from the user session
    branch_id = request.args.get("branch_id") or user.get("branch_id")
    
    if not branch_id:
        return error("Branch ID is required to fetch pending orders", 400)

    try:
        rows = query(
            """
            SELECT po.po_id, s.first_name || ' ' || s.last_name 
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.supplier_id
            WHERE po.branch_id = %s AND po.status = 'Pending'
            ORDER BY po.po_id DESC
            """,
            (branch_id,), fetchall=True, **c(user)
        )
        return success([dict(r) for r in rows])
    except Exception as e:
        print("SQL Error in get_pending_pos:", str(e))
        return error("Database query failed", 400)

@add_purchase_payment_bp.route("/po/<int:po_id>", methods=["GET"])
@jwt_or_session_required
def get_po_total(po_id):
    user = get_current_user()
    try:
        row = query(
            """
            SELECT COALESCE(SUM(sub_total), 0)::FLOAT as total
            FROM purchase_items
            WHERE po_id = %s
            """,
            (po_id,), fetchone=True, **c(user)
        )
        if not row: return error("Purchase Order not found", 404)
        return success(dict(row))
    except Exception as e:
        return error(str(e))

@add_purchase_payment_bp.route("/", methods=["POST"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Inventory Staff")
def process_purchase_payment():
    user = get_current_user()
    data = request.get_json()
    
    try:
        call_procedure(
            "add_purchase_payment",
            [int(data["po_id"]), data["payment_method"]],
            **c(user)
        )

        return success({
            "message": f"Payment successfully added for PO #{data['po_id']}",
            "status": "Confirmed"
        })
        
    except Exception as e:
        msg = str(e)
        if hasattr(e, 'diag') and e.diag.message_primary:
            msg = e.diag.message_primary
        
        print("PURCHASE PAYMENT ERROR:", msg)
        return error(msg, 400)