const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware to check player session
const isPlayer = (req, res, next) => {
    if (req.session && req.session.player) {
        return next();
    }
    return res.status(401).json({ success: false, error: 'Auth required' });
};

// Helper for consistent responses
const success = (res, data = {}) => res.json({ success: true, ...data });
const error = (res, msg, status = 500) => res.status(status).json({ success: false, error: msg });

// POST /api/game/login
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return error(res, 'Username required', 400);

        let user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

        if (user) {
            // Login existing
            await db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
            req.session.player = user;
            return success(res, { message: 'Welcome back', user });
        } else {
            // Register new
            const result = await db.run("INSERT INTO users (username, stars, hearts) VALUES (?, 0, 5)", [username]);
            const newUser = { id: result.id, username, stars: 0, hearts: 5 };
            req.session.player = newUser;
            return success(res, { message: 'Welcome new player', user: newUser });
        }
    } catch (err) {
        console.error(err);
        return error(res, 'Login failed');
    }
});

// GET /api/game/data
router.get('/data', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    if (!req.session || !req.session.player) {
        return res.json({ success: true, user: null });
    }

    const userId = req.session.player.id;

    try {
        // Refresh user stats
        const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
        if (!user) return error(res, 'User load failed');

        req.session.player = user; // Update session

        const categories = await db.all("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC");
        const unlockedRows = await db.all("SELECT category_id FROM user_unlocked_categories WHERE user_id = ?", [userId]);
        const unlockedIds = new Set(unlockedRows.map(r => r.category_id));

        const categoriesWithStatus = categories.map(cat => ({
            ...cat,
            is_unlocked: cat.unlock_cost === 0 || unlockedIds.has(cat.id)
        }));

        const currentLevel = user.level || 1;
        const levelData = await db.get("SELECT xp_required FROM levels WHERE level_number = ?", [currentLevel]);
        const nextLevelXp = levelData ? levelData.xp_required : 999999;

        success(res, {
            user,
            categories: categoriesWithStatus,
            levelProgress: {
                current: user.current_xp || 0,
                required: nextLevelXp,
                level: currentLevel
            }
        });
    } catch (err) {
        console.error(err);
        error(res, err.message);
    }
});

// POST /api/game/unlock-category
router.post('/unlock-category', isPlayer, async (req, res) => {
    const { categoryId } = req.body;
    const userId = req.session.player.id;

    try {
        const cat = await db.get("SELECT * FROM categories WHERE id = ?", [categoryId]);
        if (!cat) return error(res, 'Category not found', 404);

        const exists = await db.get("SELECT * FROM user_unlocked_categories WHERE user_id = ? AND category_id = ?", [userId, categoryId]);
        if (exists || cat.unlock_cost === 0) {
            return success(res, { message: 'Already unlocked' });
        }

        const user = await db.get("SELECT stars FROM users WHERE id = ?", [userId]);
        if (user.stars < cat.unlock_cost) {
            return error(res, 'Not enough stars', 400);
        }

        // Transaction
        await db.run('BEGIN TRANSACTION');
        try {
            await db.run("UPDATE users SET stars = stars - ? WHERE id = ?", [cat.unlock_cost, userId]);
            await db.run("INSERT INTO user_unlocked_categories (user_id, category_id) VALUES (?, ?)", [userId, categoryId]);
            await db.run('COMMIT');
            success(res, { message: 'Category unlocked!' });
        } catch (txErr) {
            await db.run('ROLLBACK');
            throw txErr;
        }

    } catch (err) {
        console.error(err);
        error(res, 'Unlock failed');
    }
});

// GET /api/game/stages/:categoryId
router.get('/stages/:categoryId', isPlayer, async (req, res) => {
    const userId = req.session.player.id;
    const categoryId = req.params.categoryId;

    try {
        const stages = await db.all("SELECT * FROM stages WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC", [categoryId]);
        const completedRows = await db.all("SELECT stage_id, stars_earned FROM user_completed_stages WHERE user_id = ?", [userId]);

        const completedMap = {};
        completedRows.forEach(r => completedMap[r.stage_id] = r.stars_earned);

        let previousStagePassed = true; // First stage allows entry

        const stagesWithStatus = stages.map((stage, index) => {
            const stars = completedMap[stage.id] || 0;
            const isUnlocked = index === 0 || previousStagePassed;
            previousStagePassed = stars >= 2;

            return {
                ...stage,
                stars_earned: stars,
                is_completed: typeof completedMap[stage.id] !== 'undefined',
                is_locked: !isUnlocked
            };
        });

        res.json(stagesWithStatus); // Sending direct array as expected by frontend
    } catch (err) {
        console.error(err);
        error(res, err.message);
    }
});

// GET /api/game/questions/:stageId
router.get('/questions/:stageId', isPlayer, async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM questions WHERE stage_id = ?", [req.params.stageId]);
        res.json(rows);
    } catch (err) {
        error(res, err.message);
    }
});

// POST /api/game/complete-stage
router.post('/complete-stage', isPlayer, async (req, res) => {
    const { stageId, starsEarned } = req.body;
    const userId = req.session.player.id;
    const stars = Math.min(3, Math.max(0, starsEarned));

    let newXp = 0;
    if (stars === 3) newXp = 15;
    else if (stars === 2) newXp = 8;

    try {
        await db.run('BEGIN TRANSACTION');

        // 1. Check previous XP
        const xpRow = await db.get("SELECT xp_earned FROM user_stage_xp WHERE user_id = ? AND stage_id = ?", [userId, stageId]);
        const oldXp = xpRow ? xpRow.xp_earned : 0;
        const xpToAdd = (newXp > oldXp) ? (newXp - oldXp) : 0;

        // 2. Update/Insert XP
        if (xpToAdd > 0) {
            if (xpRow) {
                await db.run("UPDATE user_stage_xp SET xp_earned = ? WHERE user_id = ? AND stage_id = ?", [newXp, userId, stageId]);
            } else {
                await db.run("INSERT INTO user_stage_xp (user_id, stage_id, xp_earned) VALUES (?, ?, ?)", [userId, stageId, newXp]);
            }
        }

        // 3. Update Stars
        const stageRow = await db.get("SELECT stars_earned FROM user_completed_stages WHERE user_id = ? AND stage_id = ?", [userId, stageId]);
        let starsToAdd = 0;
        if (stageRow) {
            if (stars > stageRow.stars_earned) {
                starsToAdd = stars - stageRow.stars_earned;
                await db.run("UPDATE user_completed_stages SET stars_earned = ? WHERE user_id = ? AND stage_id = ?", [stars, userId, stageId]);
            }
        } else {
            starsToAdd = stars;
            await db.run("INSERT INTO user_completed_stages (user_id, stage_id, stars_earned) VALUES (?, ?, ?)", [userId, stageId, stars]);
        }

        if (starsToAdd > 0) {
            await db.run("UPDATE users SET stars = stars + ? WHERE id = ?", [starsToAdd, userId]);
        }

        // 4. Update XP & Level
        let levelUps = [];
        let finalLevel = 0;
        let finalXp = 0;

        if (xpToAdd > 0) {
            const user = await db.get("SELECT level, current_xp FROM users WHERE id = ?", [userId]);
            let currentLevel = user.level || 1;
            let currentXp = (user.current_xp || 0) + xpToAdd;

            // Iterative level check
            while (true) {
                const levelData = await db.get("SELECT xp_required FROM levels WHERE level_number = ?", [currentLevel]);
                if (!levelData) break; // Max level reached or logic break

                if (currentXp >= levelData.xp_required) {
                    currentXp -= levelData.xp_required;
                    currentLevel++;
                    levelUps.push(currentLevel);
                } else {
                    break;
                }
            }
            finalLevel = currentLevel;
            finalXp = currentXp;

            await db.run("UPDATE users SET level = ?, current_xp = ?, total_xp = total_xp + ? WHERE id = ?", [finalLevel, finalXp, xpToAdd, userId]);

            if (req.session.player) {
                req.session.player.level = finalLevel;
                req.session.player.current_xp = finalXp;
            }
        }

        await db.run('COMMIT');

        success(res, {
            message: 'Stage completed',
            starsAdded: starsToAdd,
            xpAdded: xpToAdd,
            levelUps: levelUps,
            currentLevel: finalLevel,
            currentXp: finalXp
        });

    } catch (err) {
        await db.run('ROLLBACK');
        console.error(err);
        error(res, err.message);
    }
});

// POST /api/game/fail-stage
router.post('/fail-stage', isPlayer, async (req, res) => {
    const userId = req.session.player.id;

    try {
        const row = await db.get("SELECT hearts, infinite_hearts_until FROM users WHERE id = ?", [userId]);
        if (!row) return error(res, 'User not found', 404);

        const now = new Date();
        const hasInfiniteHearts = row.infinite_hearts_until && new Date(row.infinite_hearts_until) > now;

        if (hasInfiniteHearts) {
            return res.json({ message: 'Infinite hearts active', hearts: row.hearts, infinite: true });
        }

        if (row.hearts > 0) {
            await db.run("UPDATE users SET hearts = hearts - 1 WHERE id = ?", [userId]);
            const newHearts = row.hearts - 1;
            req.session.player.hearts = newHearts;
            res.json({ message: 'Heart deducted', hearts: newHearts });
        } else {
            res.json({ message: 'No hearts left', hearts: 0 });
        }
    } catch (err) {
        error(res, err.message);
    }
});

// GET /api/game/daily-reward
router.get('/daily-reward', isPlayer, async (req, res) => {
    try {
        const userId = req.session.player.id;
        const user = await db.get("SELECT daily_streak, last_claim_date FROM users WHERE id = ?", [userId]);

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let canClaim = user.last_claim_date !== today;
        let currentStreak = user.daily_streak || 0;
        let currentDay = (currentStreak > 0) ? currentStreak + 1 : 1;

        const allRewards = await db.all("SELECT * FROM daily_rewards WHERE is_active = 1 ORDER BY day_number ASC");
        const maxDay = allRewards.length > 0 ? Math.max(...allRewards.map(r => r.day_number)) : 7;

        if (currentDay > maxDay) currentDay = 1;

        const claimedDays = await db.all(`
            SELECT dr.day_number FROM user_daily_claims udc
            JOIN daily_rewards dr ON udc.reward_id = dr.id
            WHERE udc.user_id = ?
            ORDER BY udc.claimed_at DESC
            LIMIT ?
        `, [userId, maxDay]);

        res.json({
            rewards: allRewards,
            currentDay,
            currentStreak,
            canClaim,
            claimedDays: claimedDays.map(d => d.day_number),
            maxDay
        });
    } catch (err) {
        error(res, err.message);
    }
});

// POST /api/game/claim-daily-reward
router.post('/claim-daily-reward', isPlayer, async (req, res) => {
    const userId = req.session.player.id;

    try {
        const user = await db.get("SELECT daily_streak, last_claim_date FROM users WHERE id = ?", [userId]);
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (user.last_claim_date === today) {
            return error(res, 'Already claimed for today', 400);
        }

        let newStreak = 1;
        if (user.last_claim_date) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (user.last_claim_date === yesterdayStr) {
                newStreak = (user.daily_streak || 0) + 1;
            }
        }

        let currentDay = newStreak;
        const maxDayRes = await db.get("SELECT MAX(day_number) as maxDay FROM daily_rewards WHERE is_active = 1");
        const maxDay = maxDayRes.maxDay || 7;

        if (currentDay > maxDay) {
            currentDay = 1;
            newStreak = 1;
        }

        const reward = await db.get("SELECT * FROM daily_rewards WHERE day_number = ? AND is_active = 1 ORDER BY sort_order LIMIT 1", [currentDay]);
        if (!reward) return error(res, 'Reward not found', 404);

        await db.run('BEGIN TRANSACTION');
        try {
            if (reward.reward_type === 'stars') {
                await db.run("UPDATE users SET stars = stars + ? WHERE id = ?", [reward.reward_value, userId]);
            } else if (reward.reward_type === 'hearts') {
                await db.run("UPDATE users SET hearts = hearts + ? WHERE id = ?", [reward.reward_value, userId]);
            } else if (reward.reward_type === 'boost_15m') {
                const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                await db.run("UPDATE users SET infinite_hearts_until = ? WHERE id = ?", [expiresAt, userId]);
            } else if (reward.reward_type === 'boost_5h') {
                const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
                await db.run("UPDATE users SET infinite_hearts_until = ? WHERE id = ?", [expiresAt, userId]);
            }

            await db.run("UPDATE users SET daily_streak = ?, last_claim_date = ? WHERE id = ?", [newStreak, today, userId]);
            await db.run("INSERT INTO user_daily_claims (user_id, reward_id) VALUES (?, ?)", [userId, reward.id]);

            await db.run('COMMIT');

            // Refresh user for response
            const updatedUser = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
            if (updatedUser) req.session.player = updatedUser;

            success(res, {
                reward,
                newStreak,
                currentDay,
                message: 'Reward claimed'
            });

        } catch (txErr) {
            await db.run('ROLLBACK');
            throw txErr;
        }

    } catch (err) {
        console.error(err);
        error(res, err.message);
    }
});


module.exports = router;
