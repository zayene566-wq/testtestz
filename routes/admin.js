const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');

// Import route modules
// Import route modules
const statsRoutes = require('./stats');
const categoriesRoutes = require('./categories');
const stagesRoutes = require('./stages');
const questionsRoutes = require('./questions');
const usersRoutes = require('./users');
const dailyRewardsRoutes = require('./daily-rewards');
const levelsRoutes = require('./levels'); // Add levels route

// Apply auth middleware to all API routes
router.use(isAuthenticated);

// Mount routes
router.use('/stats', statsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/stages', stagesRoutes);
router.use('/questions', questionsRoutes);
router.use('/users', usersRoutes);
router.use('/daily-rewards', dailyRewardsRoutes);
router.use('/levels', levelsRoutes); // Mount levels
// router.use('/leaderboard', leaderboardRoutes);

module.exports = router;
