from flask import Blueprint
from db import query
from utils.responses import success, error

employees_bp = Blueprint("employees", __name__, url_prefix="/api/employees")


# ✅ GET ALL EMPLOYEES
@employees_bp.route("/", methods=["GET"])
def get_employees():
    try:
        rows = query(
            """
            SELECT 
                e.employee_id,
                e.first_name,
                e.last_name,
                e.position,
                e.phone,
                e.email,
                e.salary,
                b.branch_name
            FROM employees e
            JOIN branches b ON e.branch_id = b.branch_id
            ORDER BY e.employee_id DESC
            """,
            fetchall=True
        )

        return success(rows)

    except Exception as e:
        return error(str(e))