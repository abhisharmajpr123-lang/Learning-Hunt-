import { Router } from 'express';
import User from '../models/User.js';
import { validateSignup } from '../utils/validation.js';

const router = Router();

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
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return next(error);
  }
});

export default router;
