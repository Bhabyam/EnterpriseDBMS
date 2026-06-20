from flask import Blueprint, request
from db import query, call_procedure
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

create_po_bp = Blueprint("create_po", __name__, url_prefix="/api/create_purchase_order")

def get_db_creds(user):
    return {
        "username": user.get("db_username"),
        "password": user.get("db_password"),
    }

@create_po_bp.route("/suppliers", methods=["GET"])
@jwt_or_session_required
def get_suppliers():
    user = get_current_user()
    try:
        rows = query(
            "SELECT supplier_id, first_name || ' ' || last_name as supplier_name FROM suppliers ORDER BY supplier_name ASC",
            fetchall=True, **get_db_creds(user)
        )
        return success([dict(r) for r in rows])
    except Exception as e:
        return error(str(e), 500)

@create_po_bp.route("/products", methods=["GET"])
@jwt_or_session_required
def get_products():
    user = get_current_user()
    supplier_id = request.args.get("supplier_id")
    try:
        sql = """
            SELECT p.product_id, p.name, p.cost_price 
            FROM products p
            JOIN supplies s ON p.product_id = s.product_id
            WHERE s.supplier_id = %s ORDER BY p.name ASC
        """
        rows = query(sql, (supplier_id,), fetchall=True, **get_db_creds(user))
        return success([dict(r) for r in rows])
    except Exception as e:
        return error(str(e), 500)

@create_po_bp.route("/", methods=["POST"])
@jwt_or_session_required
def process_create_po():
    user = get_current_user()
    data = request.get_json()

    supplier_id = data.get("supplier_id")
    branch_id = data.get("branch_id") or user.get("branch_id")
    items = data.get("items", [])

    try:
        p_ids = [int(i['product_id']) for i in items if i.get('product_id')]
        p_qts = [int(i['quantity']) for i in items if i.get('product_id')]
        p_costs = [
            float(i['cost_price']) if i.get('cost_price') and str(i['cost_price']).strip() != "" 
            else None for i in items if i.get('product_id')
        ]

        call_procedure(
            "create_purchase_order", 
            [int(supplier_id), int(branch_id), p_ids, p_qts, p_costs],
            **get_db_creds(user)
        )

        return success({"message": "Purchase Order Created Successfully!"})

    except Exception as e:
        msg = str(e).split('\n')[0]
        if hasattr(e, 'diag') and e.diag.message_primary:
            msg = e.diag.message_primary
        return error(msg, 400)