import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { signToken, getExpiresIn } from '../utils/token.js';
import { validateLogin, validateSignup } from '../utils/validation.js';

const router = Router();

// Auth responses carry tokens and personal data, so they must never be cached.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
});

function publicUser(user) {
  return { id: String(user.id), name: user.name, email: user.email, role: user.role };
}

router.post('/signup', async (req, res, next) => {
  const { errors, cleanName, cleanEmail } = validateSignup(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

  try {
    const existing = await User.findOne({ email: cleanEmail }).select('_id');
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

    const user = await User.create({ name: cleanName, email: cleanEmail, password: req.body.password });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: publicUser(user)
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return next(error);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  const { errors, cleanEmail } = validateLogin(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed', errors });

  const invalid = { success: false, message: 'Invalid email or password.' };

  try {
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) return res.status(401).json(invalid);

    const matches = await user.comparePassword(req.body.password);
    if (!matches) return res.status(401).json(invalid);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token: signToken(user),
      tokenType: 'Bearer',
      expiresIn: getExpiresIn(),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => res.status(200).json({ success: true, user: req.user }));

export default router;
