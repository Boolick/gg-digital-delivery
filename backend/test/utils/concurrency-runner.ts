export interface ConcurrencyMetrics<T> {
  results: PromiseSettledResult<T>[];
  successCount: number;
  failureCount: number;
  durationMs: number;
  responses: T[];
  errors: Error[];
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export async function runConcurrent<T>(
  taskFactory: (index: number) => Promise<T>,
  count: number = 50,
): Promise<ConcurrencyMetrics<T>> {
  const individualTimings: number[] = [];
  const start = performance.now();

  const tasks = Array.from({ length: count }, async (_, index) => {
    const taskStart = performance.now();
    try {
      const result = await taskFactory(index);
      individualTimings.push(performance.now() - taskStart);
      return result;
    } catch (err) {
      individualTimings.push(performance.now() - taskStart);
      throw err;
    }
  });

  const settledResults = await Promise.allSettled(tasks);
  const durationMs = performance.now() - start;

  const responses: T[] = [];
  const errors: Error[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const r of settledResults) {
    if (r.status === 'fulfilled') {
      successCount++;
      responses.push(r.value);
    } else {
      failureCount++;
      errors.push(r.reason instanceof Error ? r.reason : new Error(String(r.reason)));
    }
  }

  individualTimings.sort((a, b) => a - b);
  const getPercentile = (p: number): number => {
    if (individualTimings.length === 0) {
      return 0;
    }
    const idx = Math.min(
      Math.floor((p / 100) * individualTimings.length),
      individualTimings.length - 1,
    );
    return Math.round(individualTimings[idx] ?? 0);
  };

  return {
    results: settledResults,
    successCount,
    failureCount,
    durationMs: Math.round(durationMs),
    responses,
    errors,
    p50Ms: getPercentile(50),
    p95Ms: getPercentile(95),
    p99Ms: getPercentile(99),
  };
}
