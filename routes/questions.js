const express = require('express');
const router = express.Router();
const db = require('../database');
const { logAction } = require('../utils/logger');

const handleError = (res, err) => {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
};

// GET /api/questions?stage_id=X
router.get('/', async (req, res) => {
    try {
        const { stage_id } = req.query;
        if (!stage_id) return res.status(400).json({ success: false, error: 'stage_id is required' });

        const rows = await db.all("SELECT * FROM questions WHERE stage_id = ?", [stage_id]);
        res.json(rows);
    } catch (err) {
        handleError(res, err);
    }
});

// POST /api/questions
router.post('/', async (req, res) => {
    try {
        const { stage_id, question_text, answer_1, answer_2, answer_3, answer_4, correct_answer } = req.body;
        const sql = `INSERT INTO questions (stage_id, question_text, answer_1, answer_2, answer_3, answer_4, correct_answer) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [stage_id, question_text, answer_1, answer_2, answer_3, answer_4, correct_answer];

        const result = await db.run(sql, params);
        logAction(req, 'create_question', { id: result.id, stage_id });
        res.json({ success: true, id: result.id, message: 'Question created' });
    } catch (err) {
        handleError(res, err);
    }
});

// PUT /api/questions/:id
router.put('/:id', async (req, res) => {
    try {
        const { question_text, answer_1, answer_2, answer_3, answer_4, correct_answer } = req.body;
        const sql = `UPDATE questions SET 
                     question_text = ?, answer_1 = ?, answer_2 = ?, answer_3 = ?, answer_4 = ?, correct_answer = ?
                     WHERE id = ?`;
        const params = [question_text, answer_1, answer_2, answer_3, answer_4, correct_answer, req.params.id];

        await db.run(sql, params);
        logAction(req, 'update_question', { id: req.params.id });
        res.json({ success: true, message: 'Question updated' });
    } catch (err) {
        handleError(res, err);
    }
});

// DELETE /api/questions/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.run("DELETE FROM questions WHERE id = ?", [req.params.id]);
        logAction(req, 'delete_question', { id: req.params.id });
        res.json({ success: true, message: 'Question deleted' });
    } catch (err) {
        handleError(res, err);
    }
});

module.exports = router;
