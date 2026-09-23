// authRoutes.js
// Handles user registration and login.
// NOTE: For learning purposes, passwords are stored as plain text.
// In a real project you MUST hash passwords (e.g. with bcrypt).

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ---------- REGISTER ----------
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, city, latitude, longitude } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please fill all required fields.' });
        }

        // check if email already used
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'This email is already registered.' });
        }

        const [result] = await db.query(
            `INSERT INTO users (name, email, password, role, phone, city, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, password, role, phone || null, city || null, latitude || null, longitude || null]
        );

        res.status(201).json({ message: 'Registration successful!', user_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while registering.' });
    }
});

// ---------- LOGIN ----------
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.query(
            'SELECT user_id, name, email, role, city, latitude, longitude FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // send back basic user info; frontend will store this in localStorage
        res.json({ message: 'Login successful!', user: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while logging in.' });
    }
});

module.exports = router;
