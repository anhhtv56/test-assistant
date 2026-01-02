import { Router } from 'express'
import User from '../models/User.js'
import { issueAccessToken, issueRefreshToken } from '../middleware/auth.js'

const router = Router();

// POST: /auth/register - Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        error: 'Email is already registered'
      });
    }

    const user = new User({ email, name });
    await user.setPassword(password);
    await user.save();
    //Generate token
    const accessToken = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);
    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;