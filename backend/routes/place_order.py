from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

place_order_bp = Blueprint("place_order", __name__, url_prefix="/api")

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

# =========================
# 🔹 GET CUSTOMERS (For Autocomplete)
# =========================
@place_order_bp.route("/customers", methods=["GET"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin")
def get_customers():
    user = get_current_user()
    try:
        rows = query(
            "SELECT customer_id, first_name, last_name, email FROM customers ORDER BY customer_id DESC LIMIT 200",
            fetchall=True, **c(user)
        )
        return success([dict(r) for r in rows])
    except Exception as e:
        return error(str(e))

# =========================
# 🔹 GET BRANCH PRODUCTS (Fixed WHERE Clause)
# =========================
@place_order_bp.route("/branch_products/<int:branch_id>", methods=["GET"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin", "Inventory Staff")
def get_branch_products(branch_id):
    user = get_current_user()
    try:
        rows = query(
            """
            SELECT 
                p.product_id, p.name as product_name, p.price,
                a.quantity, b.brand_name
            FROM accomodates a
            JOIN products p ON a.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE a.branch_id = %s
            ORDER BY p.name
            """,
            (branch_id,), fetchall=True, **c(user)
        )
        return success([dict(r) for r in rows])
    except Exception as e:
        return error(str(e))
    
# =========================
# 🔹 ADD NEW CUSTOMER
# =========================
@place_order_bp.route("/customer_actions/add", methods=["POST"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin")
def add_customer():
    user = get_current_user()
    data = request.get_json()

    try:
        # Insert using the query helper with commit=True
        new_customer = query(
            """
            INSERT INTO customers (first_name, last_name, phone, email, address, customer_type)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING customer_id, first_name, last_name, email
            """,
            (
                data.get("first_name"),
                data.get("last_name"),
                data.get("phone"),
                data.get("email"),
                data.get("address"),
                data.get("customer_type", "Regular") # Default to Regular
            ),
            fetchone=True,
            commit=True, # Critical: saves the data
            **c(user)
        )

        return success({
            "message": "Customer added successfully ✅",
            "customer": dict(new_customer)
        })

    except Exception as e:
        print(f"ADD CUSTOMER ERROR: {str(e)}")
        return error(str(e))

@place_order_bp.route("/place_order", methods=["POST"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin")
def place_order():
    user = get_current_user()
    data = request.get_json()

    try:
        # Use explicit casting to ensure Postgres treats them as arrays
        query(
            "CALL place_order(%s, %s, %s, %s::INT[], %s::INT[], %s::DECIMAL[])",
            (
                int(data["user_id"]),
                int(data["customer_id"]),
                int(data["branch_id"]),
                data["product_ids"],
                data["quantities"],
                data["discounts"]
            ),
            fetchall=False,
            commit=True,
            **c(user)
        )

        return success({"message": "Order placed successfully ✅"})

    except Exception as e:
        print(f"DATABASE ERROR: {str(e)}") # Check your terminal!
        return error(str(e))