const express = require('express');
const router = express.Router();
const db = require('../database');
const { logAction } = require('../utils/logger');

// GET /api/admin/daily-rewards
router.get('/', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM daily_rewards ORDER BY sort_order ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/daily-rewards
router.post('/', async (req, res) => {
    try {
        const { day_number, reward_type, reward_value, is_active, sort_order } = req.body;

        if (!day_number || !reward_type || reward_value === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sql = `INSERT INTO daily_rewards (day_number, reward_type, reward_value, is_active, sort_order) 
                     VALUES (?, ?, ?, ?, ?)`;
        const params = [day_number, reward_type, reward_value, is_active ?? 1, sort_order ?? 0];

        const result = await db.run(sql, params);
        logAction(req, 'create_daily_reward', { id: result.id, day_number, reward_type, reward_value });
        res.json({ id: result.id, message: 'Reward created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/daily-rewards/:id
router.put('/:id', async (req, res) => {
    try {
        const { day_number, reward_type, reward_value, is_active, sort_order } = req.body;
        const id = req.params.id;

        const sql = `UPDATE daily_rewards 
                     SET day_number = ?, reward_type = ?, reward_value = ?, is_active = ?, sort_order = ?
                     WHERE id = ?`;
        const params = [day_number, reward_type, reward_value, is_active, sort_order, id];

        await db.run(sql, params);
        logAction(req, 'update_daily_reward', { id });
        res.json({ message: 'Reward updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/daily-rewards/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.run("DELETE FROM daily_rewards WHERE id = ?", [req.params.id]);
        logAction(req, 'delete_daily_reward', { id: req.params.id });
        res.json({ message: 'Reward deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
