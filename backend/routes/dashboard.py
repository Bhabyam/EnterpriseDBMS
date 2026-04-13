from flask import Blueprint, request
from db import query
from utils.responses import success, error

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

# 🔹 HELPER: PERIOD GROUPING
def get_grouping(period, col):
    if period == "day":
        return f"DATE({col})"
    elif period == "week":
        return f"DATE_TRUNC('week', {col})"
    elif period == "year":
        return f"DATE_TRUNC('year', {col})"
    return f"DATE_TRUNC('month', {col})"

# ✅ 1. SUMMARY
@dashboard_bp.route("/summary", methods=["GET", "OPTIONS"])
def get_dashboard_summary():

    if request.method == "OPTIONS":
        return success({})

    try:
        branch_id = request.args.get("branch_id")

        if branch_id:
            orders = query(
                "SELECT COUNT(*) AS count FROM orders WHERE branch_id = %s",
                (branch_id,),
                fetchone=True
            )["count"]

            revenue = query(
                """
                SELECT COALESCE(SUM(p.amount),0) AS total
                FROM payments p
                JOIN orders o ON p.order_id = o.order_id
                WHERE o.branch_id = %s
                """,
                (branch_id,),
                fetchone=True
            )["total"]

            returns = query(
                """
                SELECT COUNT(*) AS count
                FROM return_orders ro
                JOIN orders o ON ro.order_id = o.order_id
                WHERE o.branch_id = %s
                """,
                (branch_id,),
                fetchone=True
            )["count"]

            refunds = query(
                """
                SELECT COALESCE(SUM(ri.refund_amount),0) AS total
                FROM return_items ri
                JOIN return_orders r ON ri.return_id = r.return_id
                JOIN orders o ON r.order_id = o.order_id
                WHERE o.branch_id = %s
                """,
                (branch_id,),
                fetchone=True
            )["total"]

        else:
            orders = query(
                "SELECT COUNT(*) AS count FROM orders",
                fetchone=True
            )["count"]

            revenue = query(
                "SELECT COALESCE(SUM(amount),0) AS total FROM payments",
                fetchone=True
            )["total"]

            returns = query(
                "SELECT COUNT(*) AS count FROM return_orders",
                fetchone=True
            )["count"]

            refunds = query(
                """
                SELECT COALESCE(SUM(refund_amount),0) AS total
                FROM return_items
                """,
                fetchone=True
            )["total"]

        net_revenue = (revenue or 0) - (refunds or 0)

        return success({
            "orders": orders or 0,
            "revenue": revenue or 0,
            "returns": returns or 0,
            "net_revenue": net_revenue or 0
        })

    except Exception as e:
        print("SUMMARY ERROR:", repr(e))
        return error(str(e))

# ✅ 2. REVENUE TREND
@dashboard_bp.route("/revenue_trend", methods=["GET", "OPTIONS"])
def get_revenue_trend():

    if request.method == "OPTIONS":
        return success([])

    try:
        branch_id = request.args.get("branch_id")
        period = request.args.get("period", "month")

        if period == "day":
            group = "DATE(p.payment_date)"
        elif period == "week":
            group = "DATE_TRUNC('week', p.payment_date)"
        elif period == "year":
            group = "DATE_TRUNC('year', p.payment_date)"
        else:
            group = "DATE_TRUNC('month', p.payment_date)"

        query_sql = f"""
            SELECT {group} AS date, SUM(p.amount) AS revenue
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            {"WHERE o.branch_id = %s" if branch_id else ""}
            GROUP BY date
            ORDER BY date
        """

        rows = query(
            query_sql,
            (branch_id,) if branch_id else None,
            fetchall=True
        )

        return success(rows)

    except Exception as e:
        return error(str(e))

# ✅ 3. ORDERS VS PURCHASE
@dashboard_bp.route("/orders_vs_purchase", methods=["GET", "OPTIONS"])
def get_orders_vs_purchase():

    if request.method == "OPTIONS":
        return success([])

    try:
        branch_id = request.args.get("branch_id")
        period = request.args.get("period", "month")

        if period == "day":
            group = "DATE(order_date)"
        elif period == "week":
            group = "DATE_TRUNC('week', order_date)"
        elif period == "year":
            group = "DATE_TRUNC('year', order_date)"
        else:
            group = "DATE_TRUNC('month', order_date)"

        if branch_id:
            rows = query(
                f"""
                SELECT 
                    COALESCE(o.date, p.date) AS date,
                    COALESCE(o.count,0) AS orders,
                    COALESCE(p.count,0) AS purchases
                FROM
                (
                    SELECT {group} AS date, COUNT(*) AS count
                    FROM orders
                    WHERE branch_id = %s
                    GROUP BY date
                ) o
                FULL OUTER JOIN
                (
                    SELECT {group} AS date, COUNT(*) AS count
                    FROM purchase_orders
                    WHERE branch_id = %s
                    GROUP BY date
                ) p
                ON o.date = p.date
                ORDER BY date
                """,
                (branch_id, branch_id),
                fetchall=True
            )
        else:
            rows = query(
                f"""
                SELECT 
                    COALESCE(o.date, p.date) AS date,
                    COALESCE(o.count,0) AS orders,
                    COALESCE(p.count,0) AS purchases
                FROM
                (
                    SELECT {group} AS date, COUNT(*) AS count
                    FROM orders
                    GROUP BY date
                ) o
                FULL OUTER JOIN
                (
                    SELECT {group} AS date, COUNT(*) AS count
                    FROM purchase_orders
                    GROUP BY date
                ) p
                ON o.date = p.date
                ORDER BY date
                """,
                fetchall=True
            )

        return success(rows)

    except Exception as e:
        return error(str(e))


# ✅ 4. PAYMENTS TREND
@dashboard_bp.route("/payments_trend", methods=["GET", "OPTIONS"])
def get_payments_trend():

    if request.method == "OPTIONS":
        return success([])

    try:
        branch_id = request.args.get("branch_id")
        period = request.args.get("period", "month")

        if period == "day":
            group = "DATE(o.order_date)"
        elif period == "week":
            group = "DATE_TRUNC('week', o.order_date)"
        elif period == "year":
            group = "DATE_TRUNC('year', o.order_date)"
        else:
            group = "DATE_TRUNC('month', o.order_date)"

        if branch_id:
            rows = query(
                f"""
                SELECT 
                    {group} AS date,
                    COALESCE(SUM(p.amount),0) AS customer,
                    COALESCE(SUM(ri.refund_amount),0) AS supplier
                FROM orders o
                LEFT JOIN payments p ON o.order_id = p.order_id
                LEFT JOIN return_orders ro ON o.order_id = ro.order_id
                LEFT JOIN return_items ri ON ro.return_id = ri.return_id
                WHERE o.branch_id = %s
                GROUP BY date
                ORDER BY date
                """,
                (branch_id,),
                fetchall=True
            )
        else:
            rows = query(
                f"""
                SELECT 
                    {group} AS date,
                    COALESCE(SUM(p.amount),0) AS customer,
                    COALESCE(SUM(ri.refund_amount),0) AS supplier
                FROM orders o
                LEFT JOIN payments p ON o.order_id = p.order_id
                LEFT JOIN return_orders ro ON o.order_id = ro.order_id
                LEFT JOIN return_items ri ON ro.return_id = ri.return_id
                GROUP BY date
                ORDER BY date
                """,
                fetchall=True
            )

        return success(rows)

    except Exception as e:
        print("PAYMENTS TREND ERROR:", repr(e))
        return error(str(e))

# ✅ 5. TOP SUPPLIERS
@dashboard_bp.route("/top_suppliers", methods=["GET", "OPTIONS"])
def get_top_suppliers():

    if request.method == "OPTIONS":
        return success([])

    try:
        branch_id = request.args.get("branch_id")

        if branch_id:
            rows = query(
                """
                SELECT s.first_name || ' ' || s.last_name as supplier_name, COUNT(*) AS count
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.supplier_id
                WHERE po.branch_id = %s
                GROUP BY s.first_name, s.last_name
                ORDER BY count DESC
                LIMIT 5
                """,
                (branch_id,),
                fetchall=True
            )
        else:
            rows = query(
                """
                SELECT s.first_name || ' ' || s.last_name as supplier_name, COUNT(*) AS count
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.supplier_id
                GROUP BY s.first_name, s.last_name
                ORDER BY count DESC
                LIMIT 5
                """,
                fetchall=True
            )

        return success(rows)

    except Exception as e:
        return error(str(e))


# ✅ 6. SESSIONS
@dashboard_bp.route("/sessions", methods=["GET", "OPTIONS"])
def get_sessions():

    if request.method == "OPTIONS":
        return success([])

    try:
        branch_id = request.args.get("branch_id")
        period = request.args.get("period", "month")

        if period == "day":
            group = "DATE(us.login_time)"
        elif period == "week":
            group = "DATE_TRUNC('week', us.login_time)"
        elif period == "year":
            group = "DATE_TRUNC('year', us.login_time)"
        else:
            group = "DATE_TRUNC('month', us.login_time)"

        if branch_id:
            rows = query(
                f"""
                SELECT {group} AS date, COUNT(*) AS sessions
                FROM user_sessions us
                JOIN users u ON us.user_id = u.user_id
                WHERE u.branch_id = %s
                GROUP BY date
                ORDER BY date
                """,
                (branch_id,),
                fetchall=True
            )
        else:
            rows = query(
                f"""
                SELECT {group} AS date, COUNT(*) AS sessions
                FROM user_sessions us
                GROUP BY date
                ORDER BY date
                """,
                fetchall=True
            )

        return success(rows)

    except Exception as e:
        return error(str(e))


# ✅ 7. INSIGHTS
@dashboard_bp.route("/insights", methods=["GET", "OPTIONS"])
def get_insights():

    if request.method == "OPTIONS":
        return success([])

    try:
        branch_id = request.args.get("branch_id")

        if branch_id:
            pending_orders = query(
                "SELECT COUNT(*) AS count FROM orders WHERE status='Pending' AND branch_id = %s",
                (branch_id,),
                fetchone=True
            )["count"]

            pending_po = query(
                "SELECT COUNT(*) AS count FROM purchase_orders WHERE status='Pending' AND branch_id = %s",
                (branch_id,),
                fetchone=True
            )["count"]

        else:
            pending_orders = query(
                "SELECT COUNT(*) AS count FROM orders WHERE status='Pending'",
                fetchone=True
            )["count"]

            pending_po = query(
                "SELECT COUNT(*) AS count FROM purchase_orders WHERE status='Pending'",
                fetchone=True
            )["count"]

        sessions_today = query(
            "SELECT COUNT(*) AS count FROM user_sessions WHERE DATE(login_time) = CURRENT_DATE",
            fetchone=True
        )["count"]

        insights = [
            f"{pending_orders or 0} customer orders pending",
            f"{pending_po or 0} purchase orders pending",
            # f"{sessions_today or 0} user sessions today"
        ]

        return success(insights)

    except Exception as e:
        print("INSIGHTS ERROR:", repr(e))
        return error(str(e))
    
@dashboard_bp.route("/branches", methods=["GET", "OPTIONS"])
def get_dashboard_branches():

    if request.method == "OPTIONS":
        return success([])

    try:
        rows = query(
            """
            SELECT branch_id, branch_name
            FROM branches
            ORDER BY branch_name
            """,
            fetchall=True
        )

        return success(rows)

    except Exception as e:
        return error(str(e))
    
