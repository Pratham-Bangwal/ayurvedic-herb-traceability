/**
 * Authentication Service
 * Provides secure user authentication using bcryptjs only.
 * (Removed insecure SHA256 fallback now that Docker dependency resolution is fixed.)
 */

const jwt = require('jsonwebtoken');
const bcryptLike = require('bcryptjs');

// Security constants (allow override in test to speed hashing)
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const JWT_EXPIRY = '8h';
const TOKEN_ISSUER = 'herb-trace';

/**
 * User store - in production this would be a database
 * For hackathon purposes, we're using an in-memory store with pre-hashed passwords
 */
let users = [];

// Initialize with admin user
async function initializeUsers() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcryptLike.hash(adminPassword, SALT_ROUNDS);
  users = [ { id: '1', username: adminUsername, password: hashedPassword, role: 'admin', lastLogin: null, loginAttempts: 0, locked: false } ];
  return users;
}

/**
 * Authenticate a user and generate JWT token
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Authentication result with token or error
 */
async function authenticateUser(username, password) {
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return { success: false, error: { code: 'invalid_credentials', message: 'Invalid username or password' } };
  }
  if (user.locked) {
    return { success: false, error: { code: 'account_locked', message: 'Account is locked due to too many failed attempts' } };
  }
  const isValid = await bcryptLike.compare(password, user.password);
  if (!isValid) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) user.locked = true;
    return { success: false, error: { code: 'invalid_credentials', message: 'Invalid username or password' } };
  }
  user.loginAttempts = 0; user.lastLogin = new Date();
  const token = jwt.sign({ sub: `${user.username}:${user.id}`, role: user.role, iss: TOKEN_ISSUER }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: JWT_EXPIRY });
  return { success: true, data: { token, user: { username: user.username, role: user.role } } };
}

/**
 * Create a new user (admin only function)
 * @param {Object} userData - User data with username, password, role
 * @returns {Promise<Object>} Result of user creation
 */
async function createUser(userData) {
  const { username, password, role } = userData;
  
  // Validate input
  if (!username || !password) {
    return {
      success: false,
      error: {
        code: 'invalid_input',
        message: 'Username and password are required'
      }
    };
  }
  
  // Check if username exists
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return {
      success: false,
      error: {
        code: 'username_taken',
        message: 'Username is already taken'
      }
    };
  }
  
  // Hash password
  const hashedPassword = await bcryptLike.hash(password, SALT_ROUNDS);
  
  // Create new user
  const newUser = {
    id: String(users.length + 1),
    username,
    password: hashedPassword,
    role: role || 'user',
    lastLogin: null,
    loginAttempts: 0,
    locked: false
  };
  
  users.push(newUser);
  
  return {
    success: true,
    data: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    }
  };
}

module.exports = {
  authenticateUser,
  createUser,
  initializeUsers
};