const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const query = "SELECT * FROM admins WHERE username = ?";
        const admin = await db.get(query, [username]);

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (isMatch) {
            // Set session
            req.session.user = { id: admin.id, username: admin.username, role: admin.role };
            res.json({ success: true, message: 'Login successful', user: req.session.user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
});

// GET /api/auth/check
router.get('/check', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ success: true, authenticated: true, user: req.session.user });
    } else {
        res.json({ success: true, authenticated: false });
    }
});

module.exports = router;
