from flask import Flask, request, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_session import Session

from config import Config

# Blueprints
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.products import products_bp
from routes.orders import orders_bp
from routes.payments import payments_bp
from routes.employees import employees_bp
from routes.user_sessions import user_sessions_bp
from routes.supplier_payments import supplier_payments_bp
from routes.inventory import inventory_bp
from routes.purchase_orders import purchase_orders_bp

app = Flask(__name__)

# ✅ Load ALL config from Config class
app.config.from_object(Config)

# 🌐 CORS
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)

# 🔐 Extensions
JWTManager(app)
Session(app)

# 🔁 OPTIONAL: Only if you still need manual preflight (usually not needed)
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        res = Response()
        res.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        res.headers["Access-Control-Allow-Credentials"] = "true"
        return res, 200

# 📦 Register routes
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(products_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(user_sessions_bp)
app.register_blueprint(supplier_payments_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(purchase_orders_bp)

@app.route("/")
def home():
    return {"message": "Backend running"}

if __name__ == "__main__":
    app.run(debug=True)