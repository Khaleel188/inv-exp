import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000', 'http://localhost:3001'];
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

function resolveRedisUrl(): string {
  return (
    process.env.REDIS_URL?.trim()
    || process.env.UPSTASH_REDIS_URL?.trim()
    || 'redis://localhost:6379/0'
  );
}

export function redisLogTarget(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || 'localhost';
    const port = parsed.port || '6379';
    const db = parsed.pathname.replace(/^\//, '') || '0';
    return `${parsed.protocol}//${host}:${port}/${db}`;
  } catch {
    return url;
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  redisUrl: resolveRedisUrl(),
  redisChannel: process.env.REDIS_REALTIME_CHANNEL || 'inv:realtime',
  djangoSecret: process.env.DJANGO_SECRET_KEY || 'change-me',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
