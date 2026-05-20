import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000', 'http://localhost:3001'];
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 4000),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  redisChannel: process.env.REDIS_REALTIME_CHANNEL || 'inv:realtime',
  djangoSecret: process.env.DJANGO_SECRET_KEY || 'change-me',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
