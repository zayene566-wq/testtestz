const express = require('express');
const router = express.Router();
const db = require('../database');
const { logAction } = require('../utils/logger');

// Helper for error handling
const handleError = (res, err) => {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
};

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM categories ORDER BY sort_order ASC");
        res.json(rows);
    } catch (err) {
        handleError(res, err);
    }
});

// POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { name, icon, color, unlock_cost, is_active } = req.body;
        const sql = "INSERT INTO categories (name, icon, color, unlock_cost, is_active) VALUES (?, ?, ?, ?, ?)";
        const params = [name, icon, color, unlock_cost, is_active ? 1 : 0];

        const result = await db.run(sql, params);
        logAction(req, 'create_category', { id: result.id, name });
        res.json({ success: true, id: result.id, message: 'Category created' });
    } catch (err) {
        handleError(res, err);
    }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, icon, color, unlock_cost, is_active, sort_order } = req.body;
        const sql = `UPDATE categories SET 
                     name = ?, icon = ?, color = ?, unlock_cost = ?, is_active = ?, sort_order = ?
                     WHERE id = ?`;
        const params = [name, icon, color, unlock_cost, is_active ? 1 : 0, sort_order, req.params.id];

        await db.run(sql, params);
        logAction(req, 'update_category', { id: req.params.id, name });
        res.json({ success: true, message: 'Category updated' });
    } catch (err) {
        handleError(res, err);
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.run("DELETE FROM categories WHERE id = ?", [req.params.id]);
        logAction(req, 'delete_category', { id: req.params.id });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        handleError(res, err);
    }
});

module.exports = router;
