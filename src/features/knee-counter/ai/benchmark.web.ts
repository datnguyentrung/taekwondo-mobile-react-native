export type BenchmarkResult = { inferenceFps: number; p50LatencyMs: number; p95LatencyMs: number };

type DetectorLike = { estimatePoses: (input: HTMLVideoElement) => Promise<unknown> };

export async function benchmarkDetector(detector: DetectorLike, video: HTMLVideoElement, iterations = 24): Promise<BenchmarkResult> {
  const warmup = Math.min(8, iterations);
  for (let index = 0; index < warmup; index += 1) await detector.estimatePoses(video);
  const latencies: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    await detector.estimatePoses(video);
    latencies.push(performance.now() - startedAt);
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const percentile = (value: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))] ?? 0;
  const average = latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length);
  return { inferenceFps: Math.round((1000 / Math.max(1, average)) * 10) / 10, p50LatencyMs: Math.round(percentile(0.5) * 10) / 10, p95LatencyMs: Math.round(percentile(0.95) * 10) / 10 };
}
