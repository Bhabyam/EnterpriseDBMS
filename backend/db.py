import psycopg2
import psycopg2.extras
from config import Config
import os

# SUPERUSER CONNECTION
DB_SUPERUSER = {
    "host": Config.DB_HOST,
    "port": Config.DB_PORT,
    "dbname": Config.DB_NAME,
    "user": Config.DB_USER,
    "password": Config.DB_PASSWORD,
}

def get_connection(username=None, password=None):
    if username and password:
        return psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            dbname=Config.DB_NAME,
            user=username,
            password=password,
        )
    return psycopg2.connect(**DB_SUPERUSER)


def query(sql, params=None, fetchone=False,
          fetchall=False, commit=False,
          username=None, password=None, role=None):

    conn = get_connection(username=username, password=password)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(sql, params)

        result = None
        if fetchone:
            result = cur.fetchone()
        elif fetchall:
            result = cur.fetchall()

        if commit:
            conn.commit()

        if fetchone or fetchall:
            return result
        if commit:
            return True
        return None

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        cur.close()
        conn.close()


def call_procedure(proc_name, params,
                   username=None, password=None, role=None):

    conn = get_connection(username=username, password=password)
    cur = conn.cursor()

    try:
        cur.execute(
            f"CALL public.{proc_name}({','.join(['%s']*len(params))})",
            params
        )
        conn.commit()
        return True

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        cur.close()
        conn.close()


def call_function(func_name, params,
                  username=None, password=None, role=None):

    conn = get_connection(username=username, password=password)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        placeholders = ','.join(['%s'] * len(params))
        cur.execute(
            f"SELECT * FROM public.{func_name}({placeholders})",
            params
        )
        return cur.fetchall()

    finally:
        cur.close()
        conn.close()