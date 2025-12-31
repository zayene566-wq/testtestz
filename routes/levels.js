const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/admin/levels
router.get('/', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM levels ORDER BY level_number ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/levels
router.post('/', async (req, res) => {
    try {
        const { level_number, xp_required, level_name } = req.body;
        if (!level_number || !xp_required) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sql = "INSERT INTO levels (level_number, xp_required, level_name) VALUES (?, ?, ?)";
        const result = await db.run(sql, [level_number, xp_required, level_name || `Level ${level_number}`]);
        res.json({ id: result.id, level_number, xp_required, level_name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/levels/:id
router.put('/:id', async (req, res) => {
    try {
        const { xp_required, level_number, level_name } = req.body;
        const { id } = req.params;

        const sql = "UPDATE levels SET xp_required = ?, level_number = ?, level_name = ? WHERE id = ?";
        const result = await db.run(sql, [xp_required, level_number, level_name, id]);
        res.json({ message: 'Level updated', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/levels/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.run("DELETE FROM levels WHERE id = ?", [id]);
        res.json({ message: 'Level deleted', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
