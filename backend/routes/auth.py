from flask import Blueprint, request, session, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    get_jwt_identity, get_jwt
)
import bcrypt
from user_agents import parse as parse_ua
from db import query
from utils.responses import success, error, unauthorized, server_error, created

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return error("Username and password are required")

    try:
        user = query(
            """
            SELECT u.user_id, u.username, u.email,
                   u.password_hash, u.branch_id,
                   r.role_name, r.permission_level
            FROM   users u
            JOIN   roles r ON u.role_id = r.role_id
            WHERE  u.username = %s
            """,
            (data["username"],),
            fetchone=True
        )
    except Exception as e:
        return server_error(str(e))

    if not user:
        return unauthorized("Invalid username or password")

    stored_hash = user["password_hash"]
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    try:
        password_correct = bcrypt.checkpw(
            data["password"].encode("utf-8"),
            stored_hash
        )
    except ValueError:
        password_correct = False

    if not password_correct:
        return unauthorized("Invalid username or password")

    # Parse device info from User-Agent
    raw_ua    = request.headers.get("User-Agent", "")
    parsed_ua = parse_ua(raw_ua)
    device_info = (
        f"{parsed_ua.browser.family} {parsed_ua.browser.version_string} "
        f"on {parsed_ua.os.family} {parsed_ua.os.version_string} "
        f"({'Mobile' if parsed_ua.is_mobile else 'Tablet' if parsed_ua.is_tablet else 'Desktop'})"
    )[:255]

    # Insert session using postgres superuser
    session_id = None
    try:
        row = query(
            """
            INSERT INTO user_sessions (user_id, login_time, device_info)
            VALUES (%s, CURRENT_TIMESTAMP, %s)
            RETURNING session_id
            """,
            (user["user_id"], device_info),
            fetchone=True,
            commit=True
        )
        session_id = row["session_id"] if row else None
    except Exception as e:
        print("Session insert ERROR:", str(e))
        session_id = None

    claims = {
        "user_id":          user["user_id"],
        "role":             user["role_name"],
        "permission_level": user["permission_level"],
        "branch_id":        user["branch_id"],
        "session_id":       session_id,
        "db_username":      user["username"],
        "db_password":      data["password"],
    }

    access_token  = create_access_token(
        identity=str(user["user_id"]),
        additional_claims=claims
    )
    refresh_token = create_refresh_token(
        identity=str(user["user_id"]),
        additional_claims=claims
    )

    session["user_id"]    = user["user_id"]
    session["role"]       = user["role_name"]
    session["branch_id"]  = user["branch_id"]
    session["session_id"] = session_id
    session["db_username"] = user["username"]
    session["db_password"] = data["password"]

    return success({
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user": {
            "user_id":          user["user_id"],
            "username":         user["username"],
            "email":            user["email"],
            "role":             user["role_name"],
            "permission_level": user["permission_level"],
            "branch_id":        user["branch_id"],
            "session_id":       session_id,
        }
    }, "Login successful")


@auth_bp.route("/logout", methods=["POST", "OPTIONS"])
def logout():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data       = request.get_json() or {}
    session_id = data.get("session_id") or session.get("session_id")

    if session_id:
        try:
            query(
                """
                UPDATE user_sessions
                SET    logout_time = CURRENT_TIMESTAMP
                WHERE  session_id  = %s
                AND    logout_time IS NULL
                """,
                (session_id,),
                commit=True
            )
        except Exception as e:
            print("Logout update ERROR:", str(e))

    session.clear()
    return success(message="Logged out successfully")


@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    required = ["username", "email", "password", "role_id"]
    for field in required:
        if not data.get(field):
            return error(f"'{field}' is required")

    hashed = bcrypt.hashpw(
        data["password"].encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    role_map = {
        1: "admin_role",
        2: "manager_role",
        3: "sales_exec_role",
        4: "inventory_staff_role",
        5: "cashier_role",
        6: "support_staff_role",
    }
    pg_role = role_map.get(int(data["role_id"]), "support_staff_role")

    try:
        query(
            """
            INSERT INTO users
                (username, email, password_hash, role_id, branch_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (data["username"], data["email"], hashed,
             data["role_id"], data.get("branch_id")),
            commit=True
        )

        query(
            f"CREATE USER {data['username']} WITH PASSWORD %s",
            (data["password"],),
            commit=True
        )

        query(
            f"GRANT {pg_role} TO {data['username']}",
            commit=True
        )

    except Exception as e:
        msg = str(e)
        if "unique" in msg.lower() or "already exists" in msg.lower():
            return error("Username or email already exists", 409)
        return server_error(msg)

    return created(message="User registered successfully")


@auth_bp.route("/me", methods=["GET", "OPTIONS"])
def me():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    user_id = session.get("user_id")
    if not user_id:
        return unauthorized("Not logged in")

    try:
        user = query(
            """
            SELECT u.user_id, u.username, u.email,
                   u.branch_id, r.role_name, r.permission_level
            FROM   users u
            JOIN   roles r ON u.role_id = r.role_id
            WHERE  u.user_id = %s
            """,
            (user_id,), fetchone=True
        )
    except Exception as e:
        return server_error(str(e))

    if not user:
        return unauthorized("User not found")
    return success(dict(user))