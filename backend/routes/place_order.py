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
# 🔹 GET CUSTOMERS
# =========================
@place_order_bp.route("/customers", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin")
def get_customers():

    if request.method == "OPTIONS":
        return success([])

    user = get_current_user()

    try:
        rows = query(
            """
            SELECT customer_id, first_name, last_name, email
            FROM customers
            ORDER BY customer_id DESC
            LIMIT 200
            """,
            fetchall=True,
            **c(user)
        )

        return success([dict(r) for r in rows])

    except Exception as e:
        print(e)
        return error(str(e))


# =========================
# 🔹 GET BRANCH PRODUCTS
# =========================
@place_order_bp.route("/branch_products/<int:branch_id>", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin")
def get_branch_products(branch_id):

    if request.method == "OPTIONS":
        return success([])

    user = get_current_user()

    try:
        rows = query(
            """
            SELECT 
                p.product_id,
                p.name,
                p.price,
                a.quantity,
                b.brand_name
            FROM accomodates a
            JOIN products p ON a.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            ORDER BY p.name
            """,
            (branch_id,),
            fetchall=True,
            **c(user)
        )

        return success([dict(r) for r in rows])

    except Exception as e:
        return error(str(e))


# =========================
# 🔹 RESOLVE CUSTOMER
# =========================
@place_order_bp.route("/resolve_customer", methods=["POST"])
@jwt_or_session_required
@roles_required("Cashier", "Sales Executive", "Manager", "Admin")
def resolve_customer():

    user = get_current_user()
    data = request.get_json()

    try:
        first = data.get("first_name")
        last = data.get("last_name")
        email = data.get("email")

        existing = query(
            """
            SELECT customer_id, first_name, last_name, email
            FROM customers
            WHERE first_name = %s AND last_name = %s AND email = %s
            """,
            (first, last, email),
            fetchone=True,
            **c(user)
        )

        if existing:
            return success({
                "customer_id": existing["customer_id"],
                "first_name": existing["first_name"],
                "last_name": existing["last_name"],
                "email": existing["email"],
                "is_new": False
            })

        new_id = query(
            """
            INSERT INTO customers (first_name, last_name, email)
            VALUES (%s, %s, %s)
            RETURNING customer_id
            """,
            (first, last, email),
            fetchone=True,
            **c(user)
        )["customer_id"]

        return success({
            "customer_id": new_id,
            "first_name": first,
            "last_name": last,
            "email": email,
            "is_new": True
        })

    except Exception as e:
        return error(str(e))


# =========================
# 🔹 PLACE ORDER
# =========================
@place_order_bp.route("/place_order", methods=["POST"])
@jwt_or_session_required
@roles_required("Cashier")
def place_order():

    user = get_current_user()
    data = request.get_json()

    try:
        query(
            "CALL place_order(%s,%s,%s,%s,%s,%s)",
            (
                data["user_id"],
                data["customer_id"],
                data["branch_id"],
                data["product_ids"],
                data["quantities"],
                data["discounts"]
            ),
            fetchone=False,
            **c(user)
        )

        return success({"message": "Order placed successfully"})

    except Exception as e:
        return error(str(e))