import { Request, Response, NextFunction } from 'express';
import redis from '../utils/redisClient';

/**
 * レート制限の設定
 * 無料枠: Gemini API (1分30回、1日200回)
 */
interface RateLimitConfig {
  minuteLimit: number; // 1分あたりの制限
  dailyLimit: number; // 1日あたりの制限
  enableGlobalLimit: boolean; // グローバル制限を有効化
  globalDailyLimit: number; // 全体の1日制限
}

const RATE_LIMITS: RateLimitConfig = {
  minuteLimit: parseInt(process.env.RATE_LIMIT_MINUTE || '10'), // デフォルト: 1分10回
  dailyLimit: parseInt(process.env.RATE_LIMIT_DAILY || '200'), // デフォルト: 1日200回
  enableGlobalLimit: process.env.ENABLE_GLOBAL_LIMIT === 'true',
  globalDailyLimit: parseInt(process.env.GLOBAL_DAILY_LIMIT || '5000'),
};

/**
 * IPアドレスベースのレート制限ミドルウェア
 */
export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Redisが接続されていない場合はスキップ（フォールバック）
  if (redis.status !== 'ready') {
    console.warn('⚠️  Redis not ready, rate limiting disabled');
    return next();
  }

  try {
    // IPアドレスを識別子として使用
    // req.ip uses socket peer address by default (secure)
    // If TRUST_PROXY env var is set, Express will parse X-Forwarded-For from trusted proxies only
    const ip = req.ip || 'unknown';

    const now = Date.now();
    const minuteWindow = Math.floor(now / 60000); // 1分単位のウィンドウ
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Redisキー
    const minuteKey = `rate:ip:${ip}:minute:${minuteWindow}`;
    const dayKey = `rate:ip:${ip}:day:${today}`;
    const globalDayKey = `rate:global:day:${today}`;

    // 1分間のカウントをインクリメント
    const minuteCount = await redis.incr(minuteKey);
    if (minuteCount === 1) {
      await redis.expire(minuteKey, 60); // 60秒で自動削除
    }

    // 1日のカウントをインクリメント
    const dayCount = await redis.incr(dayKey);
    if (dayCount === 1) {
      await redis.expire(dayKey, 86400); // 24時間で自動削除
    }

    // グローバル制限のカウント
    let globalCount = 0;
    if (RATE_LIMITS.enableGlobalLimit) {
      globalCount = await redis.incr(globalDayKey);
      if (globalCount === 1) {
        await redis.expire(globalDayKey, 86400);
      }
    }

    // レスポンスヘッダーに残り回数を追加
    res.setHeader('X-RateLimit-Minute-Limit', RATE_LIMITS.minuteLimit);
    res.setHeader(
      'X-RateLimit-Minute-Remaining',
      Math.max(0, RATE_LIMITS.minuteLimit - minuteCount)
    );
    res.setHeader('X-RateLimit-Daily-Limit', RATE_LIMITS.dailyLimit);
    res.setHeader('X-RateLimit-Daily-Remaining', Math.max(0, RATE_LIMITS.dailyLimit - dayCount));

    // 1分間の制限チェック
    if (minuteCount > RATE_LIMITS.minuteLimit) {
      // 次の分の境界までの秒数を計算
      const nextMinuteTimestamp = (minuteWindow + 1) * 60000;
      const secondsUntilNextMinute = Math.ceil((nextMinuteTimestamp - now) / 1000);

      console.log(`🚫 Rate limit exceeded (minute): IP=${ip}, count=${minuteCount}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'リクエストが多すぎます。1分後に再試行してください。',
        retryAfter: secondsUntilNextMinute,
        limit: {
          type: 'minute',
          limit: RATE_LIMITS.minuteLimit,
          current: minuteCount,
          resetAt: new Date(nextMinuteTimestamp).toISOString(),
        },
      });
      return;
    }

    // 1日の制限チェック
    if (dayCount > RATE_LIMITS.dailyLimit) {
      // 明日の0時（UTC）を計算
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const resetTimestamp = tomorrow.getTime();

      // 現在時刻から明日の0時までの秒数
      const secondsUntilReset = Math.ceil((resetTimestamp - now) / 1000);

      console.log(`🚫 Rate limit exceeded (daily): IP=${ip}, count=${dayCount}`);
      res.status(429).json({
        error: 'Daily Limit Exceeded',
        message: '本日の利用上限に達しました。明日再度お試しください。',
        retryAfter: secondsUntilReset,
        limit: {
          type: 'daily',
          limit: RATE_LIMITS.dailyLimit,
          current: dayCount,
          resetAt: tomorrow.toISOString(),
        },
      });
      return;
    }

    // グローバル制限チェック
    if (RATE_LIMITS.enableGlobalLimit && globalCount > RATE_LIMITS.globalDailyLimit) {
      console.log(`🚫 Global rate limit exceeded: count=${globalCount}`);
      res.status(503).json({
        error: 'Service Temporarily Unavailable',
        message: 'サービスが混雑しています。しばらくしてから再度お試しください。',
        retryAfter: 3600, // 1時間後に再試行
      });
      return;
    }

    // レート制限内であれば次へ
    next();
  } catch (error) {
    // Redis エラー時はレート制限をスキップ（サービス継続優先）
    console.error('❌ Rate limit check failed:', error);
    next();
  }
}

/**
 * 現在のレート制限状況を取得（管理用）
 */
export async function getRateLimitStatus(ip: string): Promise<{
  minuteCount: number;
  dailyCount: number;
  globalCount: number;
} | null> {
  if (redis.status !== 'ready') {
    return null;
  }

  try {
    const now = Date.now();
    const minuteWindow = Math.floor(now / 60000);
    const today = new Date().toISOString().split('T')[0];

    const minuteKey = `rate:ip:${ip}:minute:${minuteWindow}`;
    const dayKey = `rate:ip:${ip}:day:${today}`;
    const globalDayKey = `rate:global:day:${today}`;

    const [minuteCount, dailyCount, globalCount] = await Promise.all([
      redis.get(minuteKey),
      redis.get(dayKey),
      redis.get(globalDayKey),
    ]);

    return {
      minuteCount: parseInt(minuteCount || '0'),
      dailyCount: parseInt(dailyCount || '0'),
      globalCount: parseInt(globalCount || '0'),
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}
