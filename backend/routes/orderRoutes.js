// orderRoutes.js
// Handles placing an order (checkout) and viewing past orders.

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ---------- PLACE ORDER (checkout the cart) ----------
// POST /api/orders
// body: { buyer_id, items: [{ product_id, farmer_id, quantity, price }] }
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { buyer_id, items } = req.body;

        if (!buyer_id || !items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        const total_amount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        await connection.beginTransaction();

        // 1. create the order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (buyer_id, total_amount) VALUES (?, ?)',
            [buyer_id, total_amount]
        );
        const order_id = orderResult.insertId;

        // 2. insert each cart item as an order_item, and reduce stock
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, farmer_id, quantity, price)
                 VALUES (?, ?, ?, ?, ?)`,
                [order_id, item.product_id, item.farmer_id, item.quantity, item.price]
            );

            await connection.query(
                'UPDATE products SET quantity = quantity - ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Order placed successfully!', order_id });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'Server error while placing order.' });
    } finally {
        connection.release();
    }
});

// ---------- GET orders placed by a buyer/consumer ----------
// GET /api/orders/buyer/:buyerId
router.get('/buyer/:buyerId', async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE buyer_id = ? ORDER BY order_date DESC',
            [req.params.buyerId]
        );

        for (const order of orders) {
            const [items] = await db.query(
                `SELECT oi.*, p.name AS product_name, p.unit
                 FROM order_items oi JOIN products p ON oi.product_id = p.product_id
                 WHERE oi.order_id = ?`,
                [order.order_id]
            );
            order.items = items;
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching orders.' });
    }
});

// ---------- GET orders received by a farmer (which of their products were bought) ----------
// GET /api/orders/farmer/:farmerId
router.get('/farmer/:farmerId', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT oi.order_item_id, oi.quantity, oi.price, oi.order_id,
                    p.name AS product_name, o.order_date, o.status, u.name AS buyer_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             JOIN orders o ON oi.order_id = o.order_id
             JOIN users u ON o.buyer_id = u.user_id
             WHERE oi.farmer_id = ?
             ORDER BY o.order_date DESC`,
            [req.params.farmerId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching farmer orders.' });
    }
});

module.exports = router;
