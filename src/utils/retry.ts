export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; onError?: (err: unknown, attempt: number) => void } = {}
): Promise<T> {
  const { retries = 3, delayMs = 1000, onError } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (onError) onError(err, attempt);
      if (attempt <= retries) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
