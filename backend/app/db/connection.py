import psycopg2
import os

def get_connection(username, password):
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=username,
            password=password,
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        return conn
    except Exception as e:
        print("DB connection error:", e)
        return None