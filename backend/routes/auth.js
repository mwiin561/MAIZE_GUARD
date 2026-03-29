const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, region, farmSize } = req.body;
  console.log(`[AUTH] Registration attempt for: ${email}`);

  try {
    console.log('[AUTH] Checking if user exists...');
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log(`[AUTH] User already exists: ${email}`);
      return res.status(400).json({ msg: 'User already exists' });
    }

    console.log('[AUTH] Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('[AUTH] Inserting new user...');
    const newUser = await db.query(
      'INSERT INTO users (name, email, password, region, farm_size) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email',
      [name, email, hashedPassword, region, farmSize]
    );

    console.log('[AUTH] Generating JWT...');
    const payload = {
      user: {
        id: newUser.rows[0].id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' },
      (err, token) => {
        if (err) {
            console.error('[AUTH] JWT Registration error:', err);
            throw err;
        }
        console.log(`[AUTH] Registration success: ${email}`);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(`[AUTH] REGISTRATION CRITICAL ERROR: ${err.message}`);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt for: ${email}`);

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log(`[AUTH] DB Result rows: ${result.rows.length}`);
    const user = result.rows[0];

    if (!user) {
      console.log(`[AUTH] No user found for: ${email}`);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/auth/me
// @desc    Get current logged in user
// @access  Private
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, region, farm_size, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, region, farmSize } = req.body;

  try {
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), region = COALESCE($2, region), farm_size = COALESCE($3, farm_size) WHERE id = $4 RETURNING id, name, email, region, farm_size',
      [name, region, farmSize, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ msg: 'User not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
