from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

purchase_orders_bp = Blueprint(
    "purchase_orders",
    __name__,
    url_prefix="/api/purchase_orders"
)

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

# ✅ GET ALL PURCHASE ORDERS
@purchase_orders_bp.route("/", methods=["GET"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Inventory Staff")
def get_purchase_orders():
    user = get_current_user()

    try:
        if user["role"] == "Admin":
            sql = """
                SELECT 
                    po.po_id,
                    s.first_name || ' ' || s.last_name as supplier_name,
                    b.branch_name,
                    po.order_date,
                    COALESCE(SUM(pi.sub_total),0) AS total_amount,
                    (SELECT COALESCE(SUM(amount),0)
                     FROM purchase_payments 
                     WHERE po_id = po.po_id) AS paid,
                    (SELECT COALESCE(SUM(sub_total),0)
                     FROM purchase_items 
                     WHERE po_id = po.po_id)
                    -
                    (SELECT COALESCE(SUM(amount),0)
                     FROM purchase_payments 
                     WHERE po_id = po.po_id) AS remaining,
                    po.status
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.supplier_id
                JOIN branches b ON po.branch_id = b.branch_id
                JOIN purchase_items pi ON pi.po_id = po.po_id
                LEFT JOIN purchase_payments pp ON po.po_id = pp.po_id
                GROUP BY 
                    po.po_id,
                    s.first_name || ' ' || s.last_name,
                    b.branch_name,
                    po.order_date,
                    po.status
                ORDER BY po.po_id DESC
            """

        else:
            sql = """
                SELECT 
                    po.po_id,
                    s.first_name || ' ' || s.last_name as supplier_name,
                    NULL AS branch_name,
                    po.order_date,
                    COALESCE(SUM(pi.sub_total),0) AS total_amount,
                    (SELECT COALESCE(SUM(amount),0)
                     FROM purchase_payments 
                     WHERE po_id = po.po_id) AS paid,
                    (SELECT COALESCE(SUM(sub_total),0)
                     FROM purchase_items 
                     WHERE po_id = po.po_id)
                    -
                    (SELECT COALESCE(SUM(amount),0)
                     FROM purchase_payments 
                     WHERE po_id = po.po_id) AS remaining,
                    po.status
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.supplier_id
                JOIN purchase_items pi ON pi.po_id = po.po_id
                LEFT JOIN purchase_payments pp ON po.po_id = pp.po_id
                GROUP BY 
                    po.po_id,
                    s.first_name || ' ' || s.last_name,
                    po.order_date,
                    po.status
                ORDER BY po.po_id DESC
            """

        rows = query(sql, fetchall=True, **c(user))

        return success(rows)

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)
    
@purchase_orders_bp.route("/<int:po_id>", methods=["GET", "OPTIONS"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Inventory Staff")
def get_purchase_order_details(po_id):

    if request.method == "OPTIONS":
        return success({})

    try:

        items = query(
            """
            SELECT 
                p.name,
                pi.quantity,
                pi.cost_price,
                pi.sub_total
            FROM purchase_items pi
            JOIN products p ON pi.product_id = p.product_id
            WHERE pi.po_id = %s
            """,
            (po_id,),
            fetchall=True
        )

        summary = query(
            """
            SELECT 
                po.po_id,

                (SELECT COALESCE(SUM(sub_total),0)
                 FROM purchase_items 
                 WHERE po_id = po.po_id) AS total_amount,

                (SELECT COALESCE(SUM(amount),0)
                 FROM purchase_payments 
                 WHERE po_id = po.po_id) AS paid,

                (SELECT COALESCE(SUM(sub_total),0)
                 FROM purchase_items 
                 WHERE po_id = po.po_id)
                -
                (SELECT COALESCE(SUM(amount),0)
                 FROM purchase_payments 
                 WHERE po_id = po.po_id)
                AS remaining,

                po.status

            FROM purchase_orders po
            WHERE po.po_id = %s
            """,
            (po_id,),
            fetchone=True   # 🔥 THIS IS THE FIX
        )

        return success({
            "items": items,
            "summary": summary
        })

    except Exception as e:
        print("ERROR:", e)
        return error(str(e))