import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000', 'http://localhost:3001'];
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

export type RedisConfig =
  | { mode: 'tcp'; url: string; channel: string }
  | { mode: 'rest'; url: string; token: string; channel: string };

function resolveRedisConfig(): RedisConfig {
  const channel = process.env.REDIS_REALTIME_CHANNEL || 'inv:realtime';

  const restUrl =
    firstEnv('UPSTASH_REDIS_REST_URL')
    || (firstEnv('REDIS_URL').startsWith('https://') ? firstEnv('REDIS_URL') : '');

  const restToken = firstEnv('UPSTASH_REDIS_REST_TOKEN', 'REDIS_TOKEN');

  if (restUrl && restToken) {
    return { mode: 'rest', url: restUrl, token: restToken, channel };
  }

  const tcpUrl =
    firstEnv('REDIS_URL', 'UPSTASH_REDIS_URL')
    || 'redis://localhost:6379/0';

  return { mode: 'tcp', url: tcpUrl, channel };
}

export function redisLogTarget(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || 'localhost';
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return `${parsed.protocol}//${host}`;
    }
    const port = parsed.port || '6379';
    const db = parsed.pathname.replace(/^\//, '') || '0';
    return `${parsed.protocol}//${host}:${port}/${db}`;
  } catch {
    return url;
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  redis: resolveRedisConfig(),
  djangoSecret: process.env.DJANGO_SECRET_KEY || 'change-me',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
