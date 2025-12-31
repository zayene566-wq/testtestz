const db = require('../database');

const logAction = (req, action, details) => {
    const adminId = req.session?.user?.id || null;
    const ip = req.ip;
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;

    db.run("INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
        [adminId, action, detailsStr, ip],
        (err) => {
            if (err) console.error("Error logging action:", err);
        }
    );
};

module.exports = { logAction };
