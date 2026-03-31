from flask import Flask, request, jsonify
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)   
def get_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT")
        )
        print("Connection successful")
        return conn
    except Exception as e:
        print("Connection Failed",e)
        return None
