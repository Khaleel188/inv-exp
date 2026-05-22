import Redis, { RedisOptions } from 'ioredis';

/**
 * Upstash TCP client via ioredis.
 * @see https://upstash.com/docs/redis/howto/connectclient
 */
export function createRedisClient(url: string): Redis {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
  };

  if (url.includes('upstash.io')) {
    // Upstash TCP endpoints use IPv6.
    options.family = 6;
  }

  if (url.startsWith('rediss://')) {
    options.tls = {};
  }

  return new Redis(url, options);
}
