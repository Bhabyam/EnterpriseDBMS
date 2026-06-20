from flask import Blueprint, request
from db import query, call_function
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

stock_movement_bp = Blueprint("stock_movement", __name__, url_prefix="/api")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

@stock_movement_bp.route("/transfer_stock", methods=["POST"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Inventory Staff")
def transfer_stock():
    user = get_current_user()
    data = request.json
    
    if not data:
        return error("Data is required", 400)

    try:
        print(f"TRANSFER REQUEST: {data}")
        product_ids = data["product_ids"]
        quantities = data["quantities"]
        reasons = data["reasons"]
        from_branch = int(data["from_branch"])
        to_branch = int(data["to_branch"])

        if from_branch == to_branch:
            return error("Source and destination branches cannot be the same", 400)

        if not (len(product_ids) == len(quantities) == len(reasons)):
            return error("Array lengths mismatch", 400)

        params = [product_ids, from_branch, to_branch, quantities, reasons]

        # Call the PostgreSQL function using query for better type casting control
        query(
            "SELECT request_stock_movement(%s::INT[], %s, %s, %s::INT[], %s::TEXT[])",
            params,
            commit=True,
            **c(user)
        )
        
        return success({"message": "Stock transferred successfully"})

    except Exception as e:
        print(f"TRANSFER ERROR: {str(e)}")
        return error(str(e), 400)
