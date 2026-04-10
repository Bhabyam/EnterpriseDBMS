import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_PREFIX = "/api"

    # 🔐 Security
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # 🔑 JWT Expiry
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_EXPIRES_HOURS", 8))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_REFRESH_EXPIRES_DAYS", 7))
    )

    # 🧠 Session
    SESSION_TYPE = os.getenv("SESSION_TYPE", "filesystem")
    SESSION_PERMANENT = False
    PERMANENT_SESSION_LIFETIME = timedelta(
        hours=int(os.getenv("SESSION_LIFETIME_HOURS", 8))
    )

    # 🗄️ Database
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_PORT = int(os.getenv("DB_PORT", 5432))  # ✅ FIXED