// productRoutes.js
// Handles everything about products: adding, listing, searching, deleting.

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ---------- GET all products (for the marketplace page) ----------
// GET /api/products?search=tomato&category=Vegetable
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;

        let sql = `SELECT p.*, u.name AS farmer_name, u.city AS farmer_city
                   FROM products p JOIN users u ON p.farmer_id = u.user_id
                   WHERE p.quantity > 0`;
        const params = [];

        if (search) {
            sql += ' AND p.name LIKE ?';
            params.push(`%${search}%`);
        }
        if (category) {
            sql += ' AND p.category = ?';
            params.push(category);
        }
        sql += ' ORDER BY p.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
});

// ---------- GET products of one farmer (for farmer dashboard) ----------
// GET /api/products/farmer/:farmerId
router.get('/farmer/:farmerId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM products WHERE farmer_id = ? ORDER BY created_at DESC',
            [req.params.farmerId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching farmer products.' });
    }
});

// ---------- ADD a new product ----------
// POST /api/products
router.post('/', async (req, res) => {
    try {
        const { farmer_id, name, category, price, unit, quantity, description, image_url } = req.body;

        if (!farmer_id || !name || !price || !quantity) {
            return res.status(400).json({ message: 'Please fill all required fields.' });
        }

        const [result] = await db.query(
            `INSERT INTO products (farmer_id, name, category, price, unit, quantity, description, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [farmer_id, name, category || 'Other', price, unit || 'kg', quantity, description || '', image_url || null]
        );

        res.status(201).json({ message: 'Product added!', product_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while adding product.' });
    }
});

// ---------- DELETE a product ----------
// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
        res.json({ message: 'Product removed.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while deleting product.' });
    }
});

module.exports = router;
