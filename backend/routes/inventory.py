from flask import Blueprint
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

# ✅ GET FULL INVENTORY (ALL BRANCHES)
@inventory_bp.route("/", methods=["GET"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Inventory Staff")
def get_inventory():
    user = get_current_user()

    try:
        if user["role"] == "Admin":
            sql = """
                SELECT 
                    p.product_id,
                    p.name AS product_name,
                    p.price,
                    a.quantity,
                    b.brand_name,
                    c.category_name,
                    br.branch_name
                FROM accomodates a
                JOIN products p ON a.product_id = p.product_id
                JOIN brands b ON p.brand_id = b.brand_id
                JOIN categories c ON p.category_id = c.category_id
                JOIN branches br ON a.branch_id = br.branch_id
                ORDER BY p.name
            """

        else:
            sql = """
                SELECT 
                    p.product_id,
                    p.name AS product_name,
                    p.price,
                    a.quantity,
                    b.brand_name,
                    c.category_name,
                    NULL AS branch_name
                FROM accomodates a
                JOIN products p ON a.product_id = p.product_id
                JOIN brands b ON p.brand_id = b.brand_id
                JOIN categories c ON p.category_id = c.category_id
                ORDER BY p.name
            """

        rows = query(sql, fetchall=True, **c(user))

        return success(rows)

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)