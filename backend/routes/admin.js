const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET api/admin/export
// @desc    Export all data (Users and Scans) as JSON
// @access  Public (for development/demo only - should be protected in production)
router.get('/export', async (req, res) => {
  try {
    const usersResult = await db.query('SELECT id, name, email, region, farm_size, created_at FROM users');
    const scansResult = await db.query('SELECT * FROM scans');

    const exportData = {
      timestamp: new Date(),
      stats: {
        totalUsers: usersResult.rows.length,
        totalScans: scansResult.rows.length
      },
      users: usersResult.rows,
      scans: scansResult.rows
    };

    res.json(exportData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
