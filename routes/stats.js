const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/stats
router.get('/', async (req, res) => {
    try {
        const stats = {};

        const playersRow = await db.get("SELECT count(*) as count FROM users");
        stats.players = playersRow.count;

        const starsRow = await db.get("SELECT sum(stars) as count FROM users");
        stats.totalStars = starsRow.count || 0;

        const categoriesRow = await db.get("SELECT count(*) as count FROM categories");
        stats.categories = categoriesRow.count;

        const stagesRow = await db.get("SELECT count(*) as count FROM stages");
        stats.stages = stagesRow.count;

        const topPlayers = await db.all("SELECT username, stars FROM users ORDER BY stars DESC LIMIT 5");
        stats.topPlayers = topPlayers;

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
