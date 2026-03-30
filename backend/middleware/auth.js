/**
 * middleware/auth.js
 * Verifies Supabase JWT tokens and attaches user info to req.user.
 * Also exports requireAdmin for admin-only routes.
 */

const supabase = require('../config/supabase');

/**
 * requireAuth — verifies Bearer token from Supabase
 * Attaches req.user = { id, email, role }
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch role from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, is_active, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      full_name: profile.full_name,
    };
    req.token = token;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * requireAdmin — must be used AFTER requireAuth
 * Blocks access if user is not admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
