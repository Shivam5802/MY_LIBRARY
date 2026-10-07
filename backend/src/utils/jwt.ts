import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JwtPayload } from '../types/index.js';

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as unknown as number, // jsonwebtoken accepts string formats like '24h'
  };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwtSecret);
  return decoded as JwtPayload;
};
