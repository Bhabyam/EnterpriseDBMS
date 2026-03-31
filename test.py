from flask import Flask, jsonify
from flask_cors import CORS
from connection import get_connection
from flask import request


app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return """
    <h1>Retail Management System</h1>
    <a href="/products">View Products</a>
    """
@app.route("/products")
def get_products():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM product_catalog")

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(rows)
@app.route("/branch_products/<int:branch_id>")
def get_branch_products(branch_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            p.product_id,
            p.name,
            p.price,
            a.quantity
        FROM accomodates a
        JOIN products p
        ON a.product_id = p.product_id
        WHERE a.branch_id = %s
        AND a.quantity > 0
        ORDER BY p.name
    """, (branch_id,))

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(rows)
@app.route("/place_order", methods=["POST"])

def place_order_api():

    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "CALL place_order(%s,%s,%s,%s,%s,%s)",
            (
                data["user_id"],
                data["customer_id"],
                data["branch_id"],
                data["product_ids"],
                data["quantities"],
                data["discounts"]
            )
        )

        conn.commit()

        return {
            "message":"Order placed successfully"
        }

    except Exception as e:

        conn.rollback()

        message = str(e)

        if hasattr(e, "diag") and e.diag.message_primary:
            message = e.diag.message_primary

        return {
            "error": message
        }, 400

    finally:

        cursor.close()
        conn.close()

@app.route("/add_payment", methods=["POST"])
def add_payment_api():

    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "CALL add_payment(%s,%s,%s)",
            (
                data["order_id"],
                data["amount"],
                data["payment_method"]
            )
        )

        conn.commit()

        cursor.execute("""
            SELECT total_amount - COALESCE(SUM(amount),0)
            FROM orders o
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.order_id = %s
            GROUP BY total_amount
        """,(data["order_id"],))

        remaining = cursor.fetchone()[0]

        return {
            "message":"Payment added successfully",
            "remaining":remaining
        }

    except Exception as e:

        conn.rollback()

        message = str(e)

        if hasattr(e, "diag") and e.diag.message_primary:
            message = e.diag.message_primary

        return {
            "error": message
        }, 400
    finally:

        cursor.close()
        conn.close()
@app.route("/orders")
def get_orders():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            o.order_id,
            o.invoice_number,
            c.first_name || ' ' || c.last_name AS customer,
            b.branch_name,
            o.order_date,
            o.total_amount,
            COALESCE(SUM(p.amount),0) AS paid,
            o.total_amount - COALESCE(SUM(p.amount),0) AS remaining,
            o.status
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN branches b ON o.branch_id = b.branch_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        GROUP BY 
            o.order_id,
            o.invoice_number,
            customer,
            b.branch_name,
            o.order_date,
            o.total_amount,
            o.status
        ORDER BY o.order_id DESC
    """)

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(rows)
@app.route("/order/<int:order_id>")
def get_order_details(order_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            p.name,
            oi.quantity,
            oi.price,
            oi.discount,
            oi.sub_total,
            p.product_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = %s
    """, (order_id,))

    items = cursor.fetchall()

    cursor.execute("""
        SELECT 
            o.invoice_number,
            o.total_amount,
            COALESCE(SUM(p.amount),0) AS paid,
            o.total_amount - COALESCE(SUM(p.amount),0) AS remaining,
            o.status,
            EXISTS(
                SELECT 1
                FROM return_orders r
                WHERE r.order_id = o.order_id
            ) AS is_returned
        FROM orders o
        LEFT JOIN payments p ON o.order_id = p.order_id
        WHERE o.order_id = %s
        GROUP BY o.order_id, o.invoice_number, o.total_amount, o.status
    """,(order_id,))

    summary = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "items":items,
        "summary":summary
    })
@app.route("/process_return", methods=["POST"])
def process_return_api():

    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "CALL process_return(%s,%s,%s,%s,%s,%s,%s)",
            (
                data["user_id"],
                data["order_id"],
                data["reason"],
                data["product_ids"],
                data["quantities"],
                data["conditions"],
                data["refund_amounts"]
            )
        )

        conn.commit()

        return {
            "message": "Return processed successfully"
        }

    except Exception as e:

        conn.rollback()

        message = str(e)

        if hasattr(e, "diag") and e.diag.message_primary:
            message = e.diag.message_primary

        return {
            "error": message
        }, 400

    finally:

        cursor.close()
        conn.close()
@app.route("/returns")
def get_returns():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            r.return_id,
            r.order_id,
            c.first_name || ' ' || c.last_name,
            b.branch_name,
            r.reason,
            r.return_date,
            COALESCE(SUM(ri.refund_amount),0)
        FROM return_orders r
        JOIN orders o ON r.order_id = o.order_id
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN branches b ON o.branch_id = b.branch_id
        LEFT JOIN return_items ri ON r.return_id = ri.return_id
        GROUP BY r.return_id, c.first_name, c.last_name, b.branch_name
        ORDER BY r.return_id DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(rows)
@app.route("/return/<int:return_id>")
def get_return_details(return_id):

    conn = get_connection()
    cur = conn.cursor()

    # ITEMS
    cur.execute("""
        SELECT 
            p.name,
            ri.quantity,
            ri.item_condition,
            ri.refund_amount
        FROM return_items ri
        JOIN products p ON ri.product_id = p.product_id
        WHERE ri.return_id = %s
    """,(return_id,))

    items = cur.fetchall()

    # SUMMARY (FIXED GROUP BY)
    cur.execute("""
        SELECT 
            r.return_id,
            r.order_id,
            r.reason,
            r.return_date,
            COALESCE(SUM(ri.refund_amount),0)
        FROM return_orders r
        LEFT JOIN return_items ri ON r.return_id = ri.return_id
        WHERE r.return_id = %s
        GROUP BY 
            r.return_id,
            r.order_id,
            r.reason,
            r.return_date
    """,(return_id,))

    summary = cur.fetchone()

    cur.close()
    conn.close()

    return jsonify({
        "items": items,
        "summary": summary
    })
@app.route("/dashboard")
def dashboard():

    conn = get_connection()
    cur = conn.cursor()

    # total orders
    cur.execute("SELECT COUNT(*) FROM orders")
    orders = cur.fetchone()[0]

    # total revenue
    cur.execute("SELECT COALESCE(SUM(total_amount),0) FROM orders")
    revenue = cur.fetchone()[0]

    # total returns
    cur.execute("SELECT COUNT(*) FROM return_orders")
    returns = cur.fetchone()[0]

    # total refund
    cur.execute("""
        SELECT COALESCE(SUM(refund_amount),0)
        FROM return_items
    """)
    refunds = cur.fetchone()[0]

    # net revenue
    net_revenue = revenue - refunds

    # chart data
    cur.execute("""
        SELECT DATE(order_date), COUNT(*)
        FROM orders
        GROUP BY DATE(order_date)
        ORDER BY DATE(order_date)
    """)

    chart = [
        {"date": str(r[0]), "orders": r[1]}
        for r in cur.fetchall()
    ]

    cur.close()
    conn.close()

    return {
        "stats": {
            "orders": orders,
            "revenue": revenue,
            "returns": returns,
            "net_revenue": net_revenue
        },
        "chart": chart
    }
if __name__ == "__main__":
    app.run(debug=True)