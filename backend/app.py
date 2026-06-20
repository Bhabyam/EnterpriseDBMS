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
from routes.returns import returns_bp
from routes.place_order import place_order_bp
from routes.customers import customers_bp
from routes.process_return import process_return_bp
from routes.add_payment import add_payment_bp
from routes.sales_insights import sales_insights_bp
from routes.add_purchase_payment import add_purchase_payment_bp
from routes.create_purchase_order import create_po_bp
from routes.receive_goods import receive_goods_bp
from routes.stock_movement import stock_movement_bp

app = Flask(__name__)
app.config.from_object(Config)

import datetime
from flask.json.provider import DefaultJSONProvider

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        return super().default(obj)

app.json = CustomJSONProvider(app)

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
app.register_blueprint(returns_bp)
app.register_blueprint(place_order_bp)
app.register_blueprint(customers_bp)
app.register_blueprint(process_return_bp)
app.register_blueprint(add_payment_bp)
app.register_blueprint(sales_insights_bp)
app.register_blueprint(add_purchase_payment_bp)
app.register_blueprint(create_po_bp)
app.register_blueprint(receive_goods_bp)
app.register_blueprint(stock_movement_bp)

@app.route("/")
def home():
    return {"message": "Backend running"}

if __name__ == "__main__":
    app.run(debug=True)