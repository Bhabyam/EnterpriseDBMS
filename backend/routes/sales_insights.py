from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

sales_insights_bp = Blueprint(
    "sales_insights",
    __name__,
    url_prefix="/api"
)


def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }


# ✅ GET ALL CATEGORIES
@sales_insights_bp.route("/categories/", methods=["GET"])
@jwt_or_session_required
@roles_required("Sales Executive")
def get_categories():

    user = get_current_user()

    try:
        rows = query(
            """
            SELECT
                category_id,
                category_name
            FROM categories
            ORDER BY category_name
            """,
            fetchall=True,
            **c(user)
        )

        return success(rows)

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)


# ✅ GET ALL BRANDS
@sales_insights_bp.route("/brands/", methods=["GET"])
@jwt_or_session_required
@roles_required("Sales Executive")
def get_brands():

    user = get_current_user()

    try:
        rows = query(
            """
            SELECT
                brand_id,
                brand_name
            FROM brands
            ORDER BY brand_name
            """,
            fetchall=True,
            **c(user)
        )

        return success(rows)

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)


# ✅ GET SALES INSIGHTS
@sales_insights_bp.route("/sales-products/", methods=["GET"])
@jwt_or_session_required
@roles_required("Sales Executive")
def get_sales_products():

    user = get_current_user()

    try:
        sales_type = request.args.get("type", "all")
        category_id = request.args.get("category_id", "all")
        brand_id = request.args.get("brand_id", "all")

        sql = """
            SELECT
                p.product_id,
                p.name AS product,
                c.category_name AS category,
                b.brand_name AS brand,
                COALESCE(SUM(oi.quantity),0) AS sold
            FROM products p
            LEFT JOIN order_items oi
                ON p.product_id = oi.product_id
            LEFT JOIN categories c
                ON p.category_id = c.category_id
            LEFT JOIN brands b
                ON p.brand_id = b.brand_id
            WHERE 1=1
        """

        params = []

        if category_id != "all":
            sql += " AND p.category_id = %s"
            params.append(category_id)

        if brand_id != "all":
            sql += " AND p.brand_id = %s"
            params.append(brand_id)

        sql += """
            GROUP BY
                p.product_id,
                p.name,
                c.category_name,
                b.brand_name
        """

        if sales_type == "top":
            sql += " ORDER BY sold DESC, product"

        elif sales_type == "least":
            sql += " ORDER BY sold ASC, product"

        else:
            sql += " ORDER BY product"

        rows = query(
            sql,
            tuple(params),
            fetchall=True,
            **c(user)
        )

        return success(rows)

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)