const express = require('express');
const router = express.Router();
const db = require('../database');
const { logAction } = require('../utils/logger');

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const rows = await db.all("SELECT id, username, stars, hearts, is_banned, last_login FROM users ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete ALL users
router.delete('/all', async (req, res) => {
    try {
        const result = await db.run("DELETE FROM users");
        res.json({ success: true, message: `Deleted ${result.changes} users.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/action
router.post('/:id/action', async (req, res) => {
    const { action, value } = req.body;
    const userId = req.params.id;
    let sql = "";
    let params = [];

    switch (action) {
        case 'add_stars':
            sql = "UPDATE users SET stars = stars + ? WHERE id = ?";
            params = [value, userId];
            break;
        case 'remove_stars':
            sql = "UPDATE users SET stars = max(0, stars - ?) WHERE id = ?";
            params = [value, userId];
            break;
        case 'add_hearts':
            sql = "UPDATE users SET hearts = hearts + ? WHERE id = ?";
            params = [value, userId];
            break;
        case 'ban':
            sql = "UPDATE users SET is_banned = 1 WHERE id = ?";
            params = [userId];
            break;
        case 'unban':
            sql = "UPDATE users SET is_banned = 0 WHERE id = ?";
            params = [userId];
            break;
        default:
            return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        await db.run(sql, params);
        logAction(req, 'user_action', { userId, action, value });
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
