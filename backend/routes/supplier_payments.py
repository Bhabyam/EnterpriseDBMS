from flask import Blueprint, request
from db import query
from utils.responses import success, error
from utils.decorators import jwt_or_session_required, roles_required, get_current_user

supplier_payments_bp = Blueprint(
    "supplier_payments",
    __name__,
    url_prefix="/api/supplier_payments"
)

def c(user):
    return {
        "username": user.get("db_username") if user else None,
        "password": user.get("db_password") if user else None,
    }

# ✅ GET SUPPLIER PAYMENTS
@supplier_payments_bp.route("/", methods=["GET"])
@jwt_or_session_required
@roles_required("Admin", "Manager", "Sales Executive", "Inventory Staff")
def get_supplier_payments():
    user = get_current_user()

    try:
        branch_id = request.args.get("branch_id")
        params = []

        # 🔥 ADMIN → can access branches + filter
        if user["role"] == "Admin":
            sql = """
                SELECT 
                    pp.payment_id,
                    pp.po_id,
                    pp.amount,
                    pp.payment_method,
                    pp.transaction_id,
                    pp.payment_date,
                    b.branch_name
                FROM purchase_payments pp
                JOIN purchase_orders po ON pp.po_id = po.po_id
                JOIN branches b ON po.branch_id = b.branch_id
            """

            if branch_id:
                sql += " WHERE po.branch_id = %s"
                params.append(branch_id)

        # 🔥 NON-ADMIN → NO branches access
        else:
            sql = """
                SELECT 
                    pp.payment_id,
                    pp.po_id,
                    pp.amount,
                    pp.payment_method,
                    pp.transaction_id,
                    pp.payment_date,
                    NULL AS branch_name
                FROM purchase_payments pp
                JOIN purchase_orders po ON pp.po_id = po.po_id
            """

            # ⚠️ Still allow filtering (RLS should enforce correct branch anyway)
            if branch_id:
                sql += " WHERE po.branch_id = %s"
                params.append(branch_id)

        sql += " ORDER BY pp.payment_id DESC"

        rows = query(sql, params, fetchall=True, **c(user))

        return success(rows)

    except Exception as e:
        print("ERROR:", e)
        return error("Internal server error", 500)