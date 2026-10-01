// 限制同時處理張數,其餘排隊(D-125)。排隊也有上限:超過就直接拒絕(呼叫端回 429 busy),
// 避免大量請求把記憶體吃光——每一張排隊中的圖都還握著上傳的 buffer。

export class BusyError extends Error {
  constructor() {
    super('ocr_busy');
    this.name = 'BusyError';
  }
}

export interface Limiter {
  run<T>(fn: () => Promise<T>): Promise<T>;
  /** 目前執行中 + 排隊中的數量(測試與 log 用) */
  readonly pending: number;
}

export function createLimiter(concurrency: number, maxQueue: number): Limiter {
  let running = 0;
  const queue: (() => void)[] = [];

  // 有人在排隊時把名額直接交給下一位(running 不減),避免「名額剛空出、新請求插隊」讓同時數超過上限
  const release = () => {
    const next = queue.shift();
    if (next) next();
    else running--;
  };

  return {
    get pending() {
      return running + queue.length;
    },
    async run<T>(fn: () => Promise<T>): Promise<T> {
      if (running >= concurrency) {
        if (queue.length >= maxQueue) throw new BusyError();
        await new Promise<void>((resolve) => queue.push(resolve));
      } else {
        running++;
      }
      try {
        return await fn();
      } finally {
        release();
      }
    },
  };
}
