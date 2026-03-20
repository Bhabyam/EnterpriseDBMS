from app.db.connection import get_connection

def login_user(username, password):
    conn = get_connection(username, password)

    if conn:
        conn.close()
        return True
    else:
        return False