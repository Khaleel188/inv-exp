import { Redis as UpstashRedis } from '@upstash/redis';
import Redis, { RedisOptions } from 'ioredis';
import { config, redisLogTarget } from './config';

export type RedisSubscriberHandle = {
  close: () => void | Promise<void>;
};

function createUpstashRestClient(): UpstashRedis {
  const { redis } = config;
  if (redis.mode !== 'rest') {
    throw new Error('Upstash REST client requested but Redis is not in REST mode');
  }

  const fromStandardEnv =
    !process.env.REDIS_URL?.startsWith('https://')
    && !process.env.REDIS_TOKEN
    && (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)
    && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN);

  if (fromStandardEnv) {
    return UpstashRedis.fromEnv();
  }

  return new UpstashRedis({
    url: redis.url,
    token: redis.token,
  });
}

/**
 * Upstash TCP uses password-only AUTH — not ACL username "default".
 * @see https://upstash.com/docs/redis/howto/connectclient
 */
function normalizeTcpUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
      return url;
    }
    if (parsed.username && parsed.username !== 'default') {
      return url;
    }
    if (parsed.username === 'default' && parsed.password) {
      parsed.username = '';
      return parsed.toString();
    }
  } catch {
    // fall through
  }
  return url;
}

function createTcpClient(url: string): Redis {
  const normalized = normalizeTcpUrl(url);
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
  };

  if (normalized.startsWith('rediss://')) {
    options.tls = {};
  }

  if (process.env.REDIS_IPV6 === 'true') {
    options.family = 6;
  }

  return new Redis(normalized, options);
}

export function attachRedisSubscriber(
  onMessage: (raw: string) => void,
  onError: (err: Error) => void,
): RedisSubscriberHandle {
  const { redis } = config;

  if (redis.mode === 'rest') {
    const client = createUpstashRestClient();

    const subscription = client.subscribe<string>([redis.channel]);

    subscription.on('subscribe', () => {
      console.log(
        `[inv-exp] Connected to Upstash Redis at ${redisLogTarget(redis.url)} (REST)`,
      );
      console.log(`[inv-exp] Subscribed to Redis channel ${redis.channel}`);
    });

    subscription.on('message', (data) => {
      const raw =
        typeof data.message === 'string'
          ? data.message
          : JSON.stringify(data.message);
      onMessage(raw);
    });

    subscription.on('error', onError);

    return {
      close: () => subscription.unsubscribe([redis.channel]),
    };
  }

  const subscriber = createTcpClient(redis.url);

  subscriber.on('ready', () => {
    console.log(`[inv-exp] Connected to Redis at ${redisLogTarget(redis.url)} (TCP)`);
  });

  subscriber.subscribe(redis.channel, (err) => {
    if (err) {
      console.error('[inv-exp] Redis subscribe failed', err);
      process.exit(1);
    }
    console.log(`[inv-exp] Subscribed to Redis channel ${redis.channel}`);
  });

  subscriber.on('message', (_channel, raw) => {
    onMessage(raw);
  });

  subscriber.on('error', onError);

  return {
    close: () => {
      subscriber.disconnect();
    },
  };
}
