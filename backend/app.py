from decimal import Decimal
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector


app = Flask(__name__)
CORS(app)


def get_db():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "krishimart"),
    )


def close_db(cursor, connection):
    if cursor:
        cursor.close()
    if connection:
        connection.close()


@app.get("/")
def index():
    return "KrishiMart backend is running. Try /api/products"


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    required = ("name", "email", "password", "role", "state", "city")
    if not all(data.get(field) for field in required):
        return jsonify(message="Please fill all required fields."), 400
    if data["role"] not in ("farmer", "consumer", "buyer"):
        return jsonify(message="Invalid account type."), 400

    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (data["email"],))
        if cursor.fetchone():
            return jsonify(message="This email is already registered."), 400

        cursor.execute(
            """
            INSERT INTO users
                (name, email, password, role, phone, state, city)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["name"],
                data["email"],
                data["password"],
                data["role"],
                data.get("phone") or None,
                data["state"],
                data["city"],
            ),
        )
        connection.commit()
        return jsonify(message="Registration successful!", user_id=cursor.lastrowid), 201
    except mysql.connector.Error:
        if connection:
            connection.rollback()
        app.logger.exception("Registration failed")
        return jsonify(message="Server error while registering."), 500
    finally:
        close_db(cursor, connection)


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT user_id, name, email, role, state, city
            FROM users
            WHERE email = %s AND password = %s
            """,
            (data.get("email"), data.get("password")),
        )
        user = cursor.fetchone()
        if not user:
            return jsonify(message="Invalid email or password."), 401
        return jsonify(message="Login successful!", user=user)
    except mysql.connector.Error:
        app.logger.exception("Login failed")
        return jsonify(message="Server error while logging in."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/auth/profile/<int:user_id>")
def get_profile(user_id):
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT user_id, name, email, role, phone, state, city FROM users WHERE user_id = %s",
            (user_id,),
        )
        user = cursor.fetchone()
        if not user:
            return jsonify(message="User not found."), 404
        return jsonify(user)
    except mysql.connector.Error:
        app.logger.exception("Profile lookup failed")
        return jsonify(message="Server error while loading profile."), 500
    finally:
        close_db(cursor, connection)


@app.put("/api/auth/profile/<int:user_id>")
def update_profile(user_id):
    data = request.get_json(silent=True) or {}
    required = ("name", "state", "city")
    if not all(data.get(field) for field in required):
        return jsonify(message="Name, state, and city are required."), 400

    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE users
            SET name = %s, phone = %s, state = %s, city = %s
            WHERE user_id = %s
            """,
            (
                data["name"],
                data.get("phone") or None,
                data["state"],
                data["city"],
                user_id,
            ),
        )
        if cursor.rowcount == 0:
            return jsonify(message="User not found."), 404
        connection.commit()
        return jsonify(message="Profile updated successfully.")
    except mysql.connector.Error:
        if connection:
            connection.rollback()
        app.logger.exception("Profile update failed")
        return jsonify(message="Server error while updating profile."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/admin/summary")
def admin_summary():
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        result = {}
        for key, table in (("users", "users"), ("products", "products"), ("orders", "orders")):
            cursor.execute(f"SELECT COUNT(*) AS count FROM {table}")
            result[key] = cursor.fetchone()["count"]
        return jsonify(result)
    except mysql.connector.Error:
        app.logger.exception("Admin summary failed")
        return jsonify(message="Server error while loading admin summary."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/admin/users")
def admin_users():
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT user_id, name, email, role, phone, state, city, created_at
            FROM users ORDER BY created_at DESC
            """
        )
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Admin user lookup failed")
        return jsonify(message="Server error while loading users."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/admin/products")
def admin_products():
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT p.product_id, p.name, p.category, p.price, p.unit, p.quantity,
                   u.name AS farmer_name
            FROM products p JOIN users u ON p.farmer_id = u.user_id
            ORDER BY p.created_at DESC
            """
        )
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Admin product lookup failed")
        return jsonify(message="Server error while loading products."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/admin/orders")
def admin_orders():
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT o.order_id, o.total_amount, o.status, o.order_date,
                   u.name AS buyer_name, u.email AS buyer_email
            FROM orders o JOIN users u ON o.buyer_id = u.user_id
            ORDER BY o.order_date DESC
            """
        )
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Admin order lookup failed")
        return jsonify(message="Server error while loading orders."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/products")
def products():
    connection = cursor = None
    try:
        query = """
            SELECT p.*, u.name AS farmer_name, u.city AS farmer_city
            FROM products p
            JOIN users u ON p.farmer_id = u.user_id
            WHERE p.quantity > 0
        """
        params = []
        if request.args.get("search"):
            query += " AND p.name LIKE %s"
            params.append(f"%{request.args['search']}%")
        if request.args.get("category"):
            query += " AND p.category = %s"
            params.append(request.args["category"])
        query += " ORDER BY p.created_at DESC"

        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params)
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Product lookup failed")
        return jsonify(message="Server error while fetching products."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/products/farmer/<int:farmer_id>")
def farmer_products(farmer_id):
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM products WHERE farmer_id = %s ORDER BY created_at DESC",
            (farmer_id,),
        )
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Farmer product lookup failed")
        return jsonify(message="Server error while fetching farmer products."), 500
    finally:
        close_db(cursor, connection)


@app.post("/api/products")
def add_product():
    data = request.get_json(silent=True) or {}
    if not data.get("farmer_id") or not data.get("name") or not data.get("price") or not data.get("quantity"):
        return jsonify(message="Please fill all required fields."), 400

    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO products
                (farmer_id, name, category, price, unit, quantity, description, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["farmer_id"],
                data["name"],
                data.get("category") or "Other",
                data["price"],
                data.get("unit") or "kg",
                data["quantity"],
                data.get("description") or "",
                data.get("image_url"),
            ),
        )
        connection.commit()
        return jsonify(message="Product added!", product_id=cursor.lastrowid), 201
    except mysql.connector.Error:
        if connection:
            connection.rollback()
        app.logger.exception("Product creation failed")
        return jsonify(message="Server error while adding product."), 500
    finally:
        close_db(cursor, connection)


@app.delete("/api/products/<int:product_id>")
def delete_product(product_id):
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM products WHERE product_id = %s", (product_id,))
        connection.commit()
        return jsonify(message="Product removed.")
    except mysql.connector.Error:
        if connection:
            connection.rollback()
        app.logger.exception("Product deletion failed")
        return jsonify(message="Server error while deleting product."), 500
    finally:
        close_db(cursor, connection)


@app.post("/api/orders")
def place_order():
    data = request.get_json(silent=True) or {}
    items = data.get("items")
    if not data.get("buyer_id") or not isinstance(items, list) or not items:
        return jsonify(message="Cart is empty."), 400

    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        connection.start_transaction()
        total = Decimal("0")

        for item in items:
            cursor.execute(
                "SELECT quantity FROM products WHERE product_id = %s FOR UPDATE",
                (item.get("product_id"),),
            )
            product = cursor.fetchone()
            quantity = Decimal(str(item.get("quantity", 0)))
            if not product or quantity <= 0 or quantity > product["quantity"]:
                connection.rollback()
                return jsonify(message="One or more items are no longer available in the requested quantity."), 400
            total += quantity * Decimal(str(item.get("price", 0)))

        cursor.execute(
            "INSERT INTO orders (buyer_id, total_amount) VALUES (%s, %s)",
            (data["buyer_id"], total),
        )
        order_id = cursor.lastrowid

        for item in items:
            cursor.execute(
                """
                INSERT INTO order_items
                    (order_id, product_id, farmer_id, quantity, price)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    order_id,
                    item["product_id"],
                    item["farmer_id"],
                    item["quantity"],
                    item["price"],
                ),
            )
            cursor.execute(
                "UPDATE products SET quantity = quantity - %s WHERE product_id = %s",
                (item["quantity"], item["product_id"]),
            )

        connection.commit()
        return jsonify(message="Order placed successfully!", order_id=order_id), 201
    except (mysql.connector.Error, KeyError, ValueError):
        if connection:
            connection.rollback()
        app.logger.exception("Order placement failed")
        return jsonify(message="Server error while placing order."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/orders/buyer/<int:buyer_id>")
def buyer_orders(buyer_id):
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM orders WHERE buyer_id = %s ORDER BY order_date DESC",
            (buyer_id,),
        )
        orders = cursor.fetchall()
        for order in orders:
            cursor.execute(
                """
                SELECT oi.*, p.name AS product_name, p.unit
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = %s
                """,
                (order["order_id"],),
            )
            order["items"] = cursor.fetchall()
        return jsonify(orders)
    except mysql.connector.Error:
        app.logger.exception("Buyer order lookup failed")
        return jsonify(message="Server error while fetching orders."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/orders/farmer/<int:farmer_id>")
def farmer_orders(farmer_id):
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT oi.order_item_id, oi.quantity, oi.price, oi.order_id,
                   p.name AS product_name, o.order_date, o.status, u.name AS buyer_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE oi.farmer_id = %s
            ORDER BY o.order_date DESC
            """,
            (farmer_id,),
        )
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Farmer order lookup failed")
        return jsonify(message="Server error while fetching farmer orders."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/insights/demand-forecast")
def demand_forecast():
    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT p.product_id, p.name, p.category, p.quantity AS stock_left,
                   COALESCE(SUM(oi.quantity), 0) AS total_sold,
                   COALESCE(COUNT(oi.order_item_id), 0) AS times_ordered,
                   ROUND(COALESCE(AVG(oi.quantity), 0), 2) AS predicted_next_demand
            FROM products p
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.product_id
            ORDER BY total_sold DESC
            """
        )
        return jsonify(cursor.fetchall())
    except mysql.connector.Error:
        app.logger.exception("Demand forecast failed")
        return jsonify(message="Server error while generating forecast."), 500
    finally:
        close_db(cursor, connection)


@app.get("/api/insights/nearby-farmers")
def nearby_farmers():
    try:
        latitude = float(request.args["lat"])
        longitude = float(request.args["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify(message="lat and lng are required."), 400

    connection = cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT user_id, name, city, latitude, longitude
            FROM users
            WHERE role = 'farmer' AND latitude IS NOT NULL AND longitude IS NOT NULL
            """
        )
        farmers = cursor.fetchall()
        for farmer in farmers:
            farmer["distance_km"] = haversine_distance(
                latitude, longitude, float(farmer["latitude"]), float(farmer["longitude"])
            )
        farmers.sort(key=lambda farmer: farmer["distance_km"])
        return jsonify(farmers)
    except mysql.connector.Error:
        app.logger.exception("Nearby farmer lookup failed")
        return jsonify(message="Server error while calculating route."), 500
    finally:
        close_db(cursor, connection)


def haversine_distance(lat1, lon1, lat2, lon2):
    from math import atan2, cos, radians, sin, sqrt

    radius = 6371
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return round(radius * 2 * atan2(sqrt(a), sqrt(1 - a)), 1)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
