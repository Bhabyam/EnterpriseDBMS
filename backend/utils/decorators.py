from functools import wraps
from flask import session
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from utils.responses import unauthorized, forbidden

def get_current_user():
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        return {
            "user_id":     claims.get("user_id"),
            "role":        claims.get("role"),
            "branch_id":   claims.get("branch_id"),
            "session_id":  claims.get("session_id"),
            "db_username": claims.get("db_username"),
            "db_password": claims.get("db_password"),
        }
    except Exception:
        pass
    if "user_id" in session:
        return {
            "user_id":     session.get("user_id"),
            "role":        session.get("role"),
            "branch_id":   session.get("branch_id"),
            "session_id":  session.get("session_id"),
            "db_username": session.get("db_username"),
            "db_password": session.get("db_password"),
        }
    return None

def jwt_or_session_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception:
            pass
        if "user_id" in session:
            return fn(*args, **kwargs)
        return unauthorized("Please log in to access this resource")
    return wrapper

def roles_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return unauthorized()
            if user.get("role") not in allowed_roles:
                return forbidden(
                    f"Access restricted to: {', '.join(allowed_roles)}"
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator