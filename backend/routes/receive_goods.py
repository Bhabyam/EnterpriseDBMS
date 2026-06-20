from flask import Blueprint, request
from db import query, call_procedure
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

receive_goods_bp = Blueprint("receive_goods", __name__, url_prefix="/api")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

@receive_goods_bp.route("/purchase_orders_id", methods=["GET"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Inventory Staff")
def get_po_ids():
    user = get_current_user()
    try:
        sql = "SELECT po_id, status, branch_id FROM purchase_orders WHERE status != 'Delivered' ORDER BY po_id DESC"
        rows = query(sql, fetchall=True, **c(user))
        return success(rows)
    except Exception as e:
        return error(str(e), 500)

@receive_goods_bp.route("/receive_goods", methods=["POST"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Inventory Staff")
def receive_goods_api():
    user = get_current_user()
    data = request.json
    
    if not data or "po_id" not in data:
        return error("Purchase Order ID is required", 400)

    try:
        call_procedure("receive_goods", [int(data["po_id"])], **c(user))
        return success({"message": "Goods received successfully"})
    except Exception as e:
        msg = str(e)
        # Handle PostgreSQL specific error messages if possible
        if "already received" in msg:
            return error(msg, 400)
        return error(msg, 400)
