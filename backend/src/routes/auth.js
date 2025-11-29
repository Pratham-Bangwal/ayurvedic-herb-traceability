// backend/src/routes/auth.js
const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const authService = require('../services/authService');
const { limiters } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * Login endpoint - authenticates user and returns JWT token
 */
router.post('/login', limiters.auth, async (req, res) => {
  const { username, password } = req.body || {};
  
  // Input validation
  if (!username || !password) {
    return res.status(400).json({ 
      error: { 
        code: 'invalid_input',
        message: 'Username and password are required' 
      } 
    });
  }

  try {
    const result = await authService.authenticateUser(username, password);
    
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    
    return res.json({ data: result.data });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: { 
        code: 'auth_error',
        message: 'An error occurred during authentication' 
      } 
    });
  }
});

/**
 * Create user endpoint (admin only)
 * Creates a new user in the system
 */
router.post('/users', authRequired, requireRole('admin'), async (req, res) => {
  const { username, password, role } = req.body || {};
  
  // Input validation
  if (!username || !password) {
    return res.status(400).json({ 
      error: { 
        code: 'invalid_input',
        message: 'Username and password are required' 
      } 
    });
  }
  
  // Role validation
  const allowedRoles = ['user', 'farmer', 'processor', 'manufacturer', 'consumer'];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      error: {
        code: 'invalid_role',
        message: `Role must be one of: ${allowedRoles.join(', ')}`
      }
    });
  }
  
  try {
    const result = await authService.createUser({ username, password, role });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    return res.status(201).json({ data: result.data });
  } catch (error) {
    console.error('User creation error:', error);
    return res.status(500).json({ 
      error: { 
        code: 'user_creation_error',
        message: 'An error occurred while creating the user' 
      } 
    });
  }
});

module.exports = router;
