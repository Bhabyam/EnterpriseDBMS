from flask import Blueprint, request
from db import query, call_procedure
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

process_return_bp = Blueprint("process_return", __name__, url_prefix="/api/process_return")

def c(user):
    return {
        "username": user.get("db_username"),
        "password": user.get("db_password"),
    }

@process_return_bp.route("/process_return", methods=["POST"])
@jwt_or_session_required
@roles_required("Cashier", "Manager", "Admin", "Support Staff")
def process_return():
    user = get_current_user()
    data = request.get_json()

    try:
        # 1. SECURITY CHECK (Before calling procedure)
        # Ensure IDs are integers
        order_id = int(data["order_id"])
        branch_id = int(data["branch_id"])
        user_id = int(data["user_id"])

        order_info = query(
            "SELECT branch_id FROM orders WHERE order_id = %s",
            (order_id,),
            fetchone=True,
            **c(user)
        )

        if not order_info:
            return error("Order not found", 404)

        # Non-admins can only process returns for their own branch
        if user.get("role") != "Admin" and int(order_info["branch_id"]) != branch_id:
            return error(f"Unauthorized: Order belongs to branch {order_info['branch_id']}, not {branch_id}", 403)

        # 2. CALL PROCEDURE
        # We pass exactly 7 arguments as per your CREATE PROCEDURE definition
        query(
            """
            CALL public.process_return(
                %s::INT, 
                %s::INT, 
                %s::VARCHAR, 
                %s::INT[], 
                %s::INT[], 
                %s::VARCHAR[], 
                %s::NUMERIC[]
            )
            """,
            (
                user_id,
                order_id,
                data["reason"],
                data["product_ids"], # Python list [1, 2]
                data["quantities"],  # Python list [5, 10]
                data["conditions"],  # Python list ['Unused', 'Opened']
                None                 # Passing Python None triggers NULL in Postgres
            ),
            commit=True,
            **c(user)
        )

        return success({"message": "Return processed successfully ✅"})

    except Exception as e:
        # This will catch RAISE EXCEPTION from your SQL
        error_msg = str(e)
        if hasattr(e, 'diag') and e.diag.message_primary:
            error_msg = e.diag.message_primary
        
        print(f"--- DATABASE ERROR ---")
        print(f"Message: {error_msg}")
        print(f"-----------------------")
        return error(error_msg, 400)