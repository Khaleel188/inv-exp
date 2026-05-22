import Redis, { RedisOptions } from 'ioredis';

/**
 * TCP Redis client (ioredis). Upstash:
 * rediss://default:PASSWORD@endpoint.upstash.io:6379
 * @see https://upstash.com/docs/redis/howto/connectclient
 */
export function createRedisClient(url: string): Redis {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
  };

  if (url.startsWith('rediss://')) {
    options.tls = {};
  }

  // Some platforms (e.g. Fly.io) need IPv6; most Upstash endpoints resolve on IPv4.
  if (process.env.REDIS_IPV6 === 'true') {
    options.family = 6;
  }

  return new Redis(url, options);
}
