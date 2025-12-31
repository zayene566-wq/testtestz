const express = require('express');
const router = express.Router();
const db = require('../database');
const { logAction } = require('../utils/logger');

const handleError = (res, err) => {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
};

// GET /api/stages?category_id=X
router.get('/', async (req, res) => {
    try {
        const { category_id } = req.query;
        let sql = "SELECT * FROM stages";
        const params = [];

        if (category_id) {
            sql += " WHERE category_id = ?";
            params.push(category_id);
        }
        sql += " ORDER BY sort_order ASC";

        const rows = await db.all(sql, params);
        res.json(rows);
    } catch (err) {
        handleError(res, err);
    }
});

// POST /api/stages
router.post('/', async (req, res) => {
    try {
        const { category_id, sort_order, is_active } = req.body;
        const sql = "INSERT INTO stages (category_id, sort_order, is_active) VALUES (?, ?, ?)";
        const params = [category_id, sort_order, is_active ? 1 : 0];

        const result = await db.run(sql, params);
        logAction(req, 'create_stage', { id: result.id, category_id });
        res.json({ success: true, id: result.id, message: 'Stage created' });
    } catch (err) {
        handleError(res, err);
    }
});

// PUT /api/stages/:id
router.put('/:id', async (req, res) => {
    try {
        const { sort_order, is_active } = req.body;
        const sql = "UPDATE stages SET sort_order = ?, is_active = ? WHERE id = ?";
        const params = [sort_order, is_active ? 1 : 0, req.params.id];

        await db.run(sql, params);
        logAction(req, 'update_stage', { id: req.params.id });
        res.json({ success: true, message: 'Stage updated' });
    } catch (err) {
        handleError(res, err);
    }
});

// DELETE /api/stages/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.run("DELETE FROM stages WHERE id = ?", [req.params.id]);
        logAction(req, 'delete_stage', { id: req.params.id });
        res.json({ success: true, message: 'Stage deleted' });
    } catch (err) {
        handleError(res, err);
    }
});

module.exports = router;
