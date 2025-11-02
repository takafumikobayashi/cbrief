import Redis from 'ioredis';

// Lazy initialization: create Redis client only when first accessed
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    // Redis接続設定
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      // Upstash等のTLS接続が必要な場合
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      // 接続失敗時のリトライ設定
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // タイムアウト設定
      connectTimeout: 10000,
      // 再接続設定
      maxRetriesPerRequest: 3,
    };

    console.log('🔧 Redis config:', {
      host: redisConfig.host,
      port: redisConfig.port,
      hasTLS: !!redisConfig.tls,
      hasPassword: !!redisConfig.password,
    });

    // Redisクライアント作成
    redis = new Redis(redisConfig);

    // 接続イベントハンドラ
    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    redis.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
  }

  return redis;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redis) {
    // Use disconnect() instead of quit() if connection never established
    // to avoid hanging on MaxRetriesPerRequestError
    if (redis.status === 'ready') {
      await redis.quit();
    } else {
      redis.disconnect();
    }
  }
  process.exit(0);
});

// Disconnect function for cleanup (used in tests)
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    // Remove all event listeners to prevent memory leaks
    redis.removeAllListeners();

    // Use disconnect() instead of quit() if connection never established
    // This prevents MaxRetriesPerRequestError in test environments where Redis isn't running
    if (redis.status === 'ready') {
      // Graceful shutdown: send QUIT command and close connection
      await redis.quit();
    } else {
      // Force disconnect: close connection immediately without sending commands
      redis.disconnect();
    }
    redis = null;
  }
}

// Export both the getter function and a default that uses lazy initialization
export { getRedisClient };
export default new Proxy({} as Redis, {
  get(target, prop) {
    const client = getRedisClient();
    const value = client[prop as keyof Redis];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
