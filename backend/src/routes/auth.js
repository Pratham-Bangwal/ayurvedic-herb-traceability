// backend/src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: { message: 'JWT not configured' } });
  }
  if (!username || !password) {
    return res.status(400).json({ error: { message: 'username and password required' } });
  }

  if (username === adminUser && password === adminPass) {
    const payload = { sub: `admin:${username}`, role: 'admin', iss: 'herb-trace' };
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });
    return res.json({ data: { token, role: 'admin' } });
  }

  return res.status(401).json({ error: { message: 'Invalid credentials' } });
});

module.exports = router;
