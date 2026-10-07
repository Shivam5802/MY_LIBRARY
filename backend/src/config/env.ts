import dotenv from 'dotenv';
import dns from 'dns';

// Ensure IPv4 lookup priority for Node.js on dual-stack networks (fixes Render PG timeouts)
dns.setDefaultResultOrder('ipv4first');

// Load environment variables from .env
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  seed: {
    ownerUsername?: string;
    ownerPassword?: string;
    developerUsername?: string;
    developerPassword?: string;
  };
}

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: getEnvOrThrow('DATABASE_URL'),
  jwtSecret: getEnvOrThrow('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  seed: {
    ownerUsername: process.env.SEED_OWNER_USERNAME,
    ownerPassword: process.env.SEED_OWNER_PASSWORD,
    developerUsername: process.env.SEED_DEVELOPER_USERNAME,
    developerPassword: process.env.SEED_DEVELOPER_PASSWORD,
  },
};
