from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")

def c(user):
    return{
        "username" : user.get("db_username") if user else None,
        "password" : user.get("db_password") if user else None,
    }

@customers_bp.route("/", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Cashier", "Sales Executive")
def get_customers():
    
    if request.method == "OPTIONS":
        return success([])
    
    try:
        user = get_current_user()

        rows = query(
            """
            SELECT customer_id, first_name, last_name, email
            FROM customers
            ORDER BY customer_id DESC
            """,
            fetchall=True,
            **c(user)
        )

        return success([dict(r) for r in rows])
    except Exception as e:
        print(e)
        return error(str(e))