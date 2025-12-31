const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware to check player session (Reuse from game.js or common?)
// We should probably extract this middleware, but for now, duplication is safer for speed.
const isPlayer = (req, res, next) => {
    if (req.session && req.session.player) {
        return next();
    }
    return res.status(401).json({ error: 'Auth required' });
};

// Config for Prices
const PRICES = {
    'heart': 50,
    'boost_15m': 200,
    'boost_5h': 1000,
    'hint_skip': 30,
    'hint_remove': 20,
    'hint_time': 15
};

router.post('/buy', isPlayer, async (req, res) => {
    const { itemType } = req.body;
    const userId = req.session.player.id;

    if (!PRICES[itemType]) {
        return res.status(400).json({ error: 'Invalid item' });
    }

    const cost = PRICES[itemType];

    try {
        const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
        if (!user) return res.status(500).json({ error: 'User load failed' });

        if (user.stars < cost) {
            return res.status(400).json({ error: 'Not enough stars' });
        }

        // Transaction
        await db.run('BEGIN TRANSACTION');
        try {
            // Deduct Stars
            await db.run("UPDATE users SET stars = stars - ? WHERE id = ?", [cost, userId]);

            // Log Purchase
            await db.run("INSERT INTO user_purchases (user_id, item_type, cost) VALUES (?, ?, ?)", [userId, itemType, cost]);

            // Grant Item
            if (itemType === 'heart') {
                await db.run("UPDATE users SET hearts = hearts + 1 WHERE id = ?", [userId]);
                await db.run('COMMIT');
                res.json({ success: true, message: 'Heart purchased', cost });
            } else if (itemType.startsWith('boost_')) {
                const durationMinutes = itemType === 'boost_15m' ? 15 : 300;
                const expiry = new Date(Date.now() + durationMinutes * 60000).toISOString();
                await db.run("UPDATE users SET infinite_hearts_until = ? WHERE id = ?", [expiry, userId]);
                await db.run('COMMIT');
                res.json({ success: true, message: `Boost activated for ${durationMinutes}m`, cost });
            } else if (itemType.startsWith('hint_')) {
                const sql = `
                    INSERT INTO user_inventory (user_id, item_type, quantity) 
                    VALUES (?, ?, 1) 
                    ON CONFLICT(user_id, item_type) 
                    DO UPDATE SET quantity = quantity + 1
                `;
                await db.run(sql, [userId, itemType]);
                await db.run('COMMIT');
                res.json({ success: true, message: 'Hint added', cost });
            } else {
                await db.run('ROLLBACK'); // Should not happen if item checked
                res.status(400).json({ error: "Unknown item logic" });
            }

        } catch (txErr) {
            await db.run('ROLLBACK');
            throw txErr;
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Purchase failed' });
    }
});

module.exports = router;
