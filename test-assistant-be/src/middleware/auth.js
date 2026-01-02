import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/index.js';

// Function to issue access token
export function issueAccessToken(user) {
  return jwt.sign(
    { 
      sub: String(user._id), 
      email: user.email, 
      name: user.name 
    }, 
    jwtConfig.secret, 
    { 
      expiresIn: jwtConfig.accessTokenTtlSec 
    }
  );
}

// Function to issue refresh token
export function issueRefreshToken(user) {
  return jwt.sign(
    { 
      sub: String(user._id), 
      type: 'refresh' 
    }, 
    jwtConfig.secret, 
    { 
      expiresIn: jwtConfig.refreshTokenTtlSec 
    }
  );
}