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

// POST: /auth/login - Login an existing user
router.post('/login', async(req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
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
    })
  } catch (error) {
    next(error);
  }
});

export default router;