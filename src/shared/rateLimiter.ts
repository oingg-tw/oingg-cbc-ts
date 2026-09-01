import { Request, Response, NextFunction } from 'ultimate-express';

/**
 * 保護 ingest 端點不被過度觸發。
 *
 * 這裡要擋的不是「陌生人打進來」（那是 requireTaskSecret 的工作，必須掛在這個 middleware 之前），
 * 而是「就算密鑰外洩、或排程本身異常狂打，也不會讓這台服務跟著無限次去打 GCIS/CBC/財政部」——
 * 那才是真正會導致這些外部資料源把我們的伺服器 IP 鎖起來、或把 GCIS 節流額度用光的路徑。
 * company-industry-classification 那個端點還會下載 322MB 的檔案，重複觸發的成本更高。
 *
 * 用 req.originalUrl 當 key，讓每個 dataset 各自獨立限流，不會因為一個 dataset 在跑就卡住其他的。
 * 用記憶體實作就夠：這個服務單一 instance 執行、沒有跨 instance 共享狀態的需求，也不需要為了這個
 * 引入 Redis 之類的外部依賴。
 *
 * （跟 oingg-tpex-ts 的 ingestRateLimit 是同一套實作。）
 */
const IN_FLIGHT_PATHS = new Set<string>();
const LAST_COMPLETED_AT = new Map<string, number>();
const COOLDOWN_MS = 60_000; // 同一個 dataset 兩次成功觸發之間至少間隔 60 秒

export const ingestRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl;

  if (IN_FLIGHT_PATHS.has(key)) {
    return res.status(429).json({ message: 'This dataset ingestion is already in progress. Please wait for it to finish.' });
  }

  const lastCompletedAt = LAST_COMPLETED_AT.get(key);
  if (lastCompletedAt !== undefined) {
    const elapsedMs = Date.now() - lastCompletedAt;
    if (elapsedMs < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
      res.setHeader('Retry-After', String(waitSeconds));
      return res.status(429).json({ message: `Too many requests. Please wait ${waitSeconds}s before triggering this dataset again.` });
    }
  }

  IN_FLIGHT_PATHS.add(key);
  res.on('finish', () => {
    IN_FLIGHT_PATHS.delete(key);
    LAST_COMPLETED_AT.set(key, Date.now());
  });

  next();
};
