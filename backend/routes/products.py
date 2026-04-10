from flask import Blueprint, request
from db import query
from utils.responses import success, error, not_found

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


# ✅ GET ALL PRODUCTS
@products_bp.route("/", methods=["GET", "OPTIONS"])
def get_all_products():
    if request.method == "OPTIONS":
        return success([])

    try:
        rows = query(
            """
            SELECT p.product_id, p.name, p.price,
                   p.gst, p.cost_price, p.description,
                   c.category_name, b.brand_name, u.unit_name
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            JOIN brands b     ON p.brand_id     = b.brand_id
            JOIN units u      ON p.unit_id      = u.unit_id
            ORDER BY p.product_id
            """,
            fetchall=True
        )

        return success(rows)

    except Exception as e:
        return error(str(e))


# ✅ GET SINGLE PRODUCT
@products_bp.route("/<int:product_id>", methods=["GET", "OPTIONS"])
def get_product(product_id):
    if request.method == "OPTIONS":
        return success({})

    try:
        row = query(
            """
            SELECT p.product_id, p.name, p.price,
                   p.gst, p.cost_price, p.description,
                   c.category_name, b.brand_name, u.unit_name
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            JOIN brands b     ON p.brand_id     = b.brand_id
            JOIN units u      ON p.unit_id      = u.unit_id
            WHERE p.product_id = %s
            """,
            (product_id,),
            fetchone=True
        )

        if not row:
            return not_found("Product not found")

        return success(row)

    except Exception as e:
        return error(str(e))


# ✅ CREATE PRODUCT
@products_bp.route("/", methods=["POST", "OPTIONS"])
def create_product():
    if request.method == "OPTIONS":
        return success({})

    data = request.get_json()

    try:
        query(
            """
            INSERT INTO products
                (name, category_id, brand_id, unit_id,
                 price, gst, cost_price, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data.get("name"),
                data.get("category_id"),
                data.get("brand_id"),
                data.get("unit_id"),
                data.get("price"),
                data.get("gst", 0),
                data.get("cost_price"),
                data.get("description"),
            ),
            commit=True
        )

        return success(message="Product created")

    except Exception as e:
        return error(str(e))


# ✅ DELETE PRODUCT
@products_bp.route("/<int:product_id>", methods=["DELETE", "OPTIONS"])
def delete_product(product_id):
    if request.method == "OPTIONS":
        return success({})

    try:
        query(
            "DELETE FROM products WHERE product_id = %s",
            (product_id,),
            commit=True
        )

        return success(message="Product deleted")

    except Exception as e:
        return error(str(e))