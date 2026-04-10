from flask import Blueprint, request
from db import query
from utils.responses import success, error

user_sessions_bp = Blueprint("user_sessions", __name__, url_prefix="/api/user_sessions")


# ✅ GET USER SESSIONS
@user_sessions_bp.route("/", methods=["GET"])
def get_user_sessions():
    try:
        branch_id = request.args.get("branch_id")

        sql = """
            SELECT 
                us.session_id,
                u.username,
                r.role_name,
                b.branch_name,
                us.login_time,
                us.logout_time,
                us.device_info
            FROM user_sessions us
            JOIN users u ON us.user_id = u.user_id
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN branches b ON u.branch_id = b.branch_id
        """

        params = []

        if branch_id:
            sql += " WHERE u.branch_id = %s"
            params.append(branch_id)

        sql += " ORDER BY us.login_time DESC"

        rows = query(sql, params, fetchall=True)

        return success(rows)

    except Exception as e:
        return error(str(e))