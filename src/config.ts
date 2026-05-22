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

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
}

function isLocalRedisUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }
}

export type RedisConfig =
  | { mode: 'tcp'; url: string; channel: string }
  | { mode: 'rest'; url: string; token: string; channel: string };

function resolveRedisConfig(): RedisConfig {
  const channel = process.env.REDIS_REALTIME_CHANNEL || 'inv:realtime';

  const redisUrl = firstEnv('REDIS_URL');

  const restUrl =
    firstEnv('UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL')
    || (redisUrl.startsWith('https://') ? redisUrl : '');

  const restToken = firstEnv(
    'UPSTASH_REDIS_REST_TOKEN',
    'KV_REST_API_TOKEN',
    'REDIS_TOKEN',
  );

  if (restUrl && restToken) {
    return { mode: 'rest', url: restUrl, token: restToken, channel };
  }

  const tcpUrl = redisUrl || firstEnv('UPSTASH_REDIS_URL');

  if (tcpUrl) {
    if (isProduction() && isLocalRedisUrl(tcpUrl)) {
      throw new Error(
        'REDIS_URL points to localhost, which is not available on Render. '
        + 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the Upstash console.',
      );
    }
    return { mode: 'tcp', url: tcpUrl, channel };
  }

  if (isProduction()) {
    throw new Error(
      'Redis is not configured. On Render, set UPSTASH_REDIS_REST_URL and '
      + 'UPSTASH_REDIS_REST_TOKEN (Upstash console → REST API).',
    );
  }

  return { mode: 'tcp', url: 'redis://localhost:6379/0', channel };
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
  host: process.env.HOST || '0.0.0.0',
  redis: resolveRedisConfig(),
  djangoSecret: process.env.DJANGO_SECRET_KEY || 'change-me',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
