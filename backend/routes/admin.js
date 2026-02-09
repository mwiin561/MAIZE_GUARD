const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Scan = require('../models/Scan');

// @route   GET api/admin/export
// @desc    Export all data (Users and Scans) as JSON
// @access  Public (for development/demo only - should be protected in production)
router.get('/export', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    const scans = await Scan.find();

    const exportData = {
      timestamp: new Date(),
      stats: {
        totalUsers: users.length,
        totalScans: scans.length
      },
      users: users,
      scans: scans
    };

    res.json(exportData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
