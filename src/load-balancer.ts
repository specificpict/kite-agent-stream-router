export interface QualityFeedback {
  provider: string;
  latencyMs: number;
  success: boolean;
  timestamp: number;
}

export interface DynamicWeightConfig {
  latencyWeight: number; // e.g. 0.4
  successRateWeight: number; // e.g. 0.6
  windowSize: number; // number of samples
}

export interface ProviderScore {
  provider: string;
  successRate: number;
  averageLatencyMs: number;
  compositeScore: number; // higher is better (0-100)
}

export class DynamicLoadBalancer {
  private history: Map<string, QualityFeedback[]> = new Map();
  private config: DynamicWeightConfig;

  constructor(config?: Partial<DynamicWeightConfig>) {
    this.config = {
      latencyWeight: config?.latencyWeight ?? 0.4,
      successRateWeight: config?.successRateWeight ?? 0.6,
      windowSize: config?.windowSize ?? 20,
    };
  }

  public recordFeedback(feedback: QualityFeedback): void {
    const list = this.history.get(feedback.provider) || [];
    list.push(feedback);
    if (list.length > this.config.windowSize) {
      list.shift();
    }
    this.history.set(feedback.provider, list);
  }

  public getScore(provider: string): ProviderScore {
    const list = this.history.get(provider) || [];
    if (list.length === 0) {
      return {
        provider,
        successRate: 1.0,
        averageLatencyMs: 100,
        compositeScore: 80.0,
      };
    }

    const successes = list.filter((f) => f.success).length;
    const successRate = successes / list.length;
    const avgLatency = list.reduce((acc, f) => acc + f.latencyMs, 0) / list.length;

    // Normalize latency: 0ms -> 100, 1000ms+ -> 0
    const latencyScore = Math.max(0, Math.min(100, 100 - avgLatency / 10));
    const successScore = successRate * 100;

    const compositeScore =
      this.config.latencyWeight * latencyScore +
      this.config.successRateWeight * successScore;

    return {
      provider,
      successRate,
      averageLatencyMs: avgLatency,
      compositeScore,
    };
  }

  public selectBestProvider(candidateProviders: string[]): string | null {
    if (candidateProviders.length === 0) return null;

    let bestProvider = candidateProviders[0];
    let bestScore = -1;

    for (const p of candidateProviders) {
      const score = this.getScore(p).compositeScore;
      if (score > bestScore) {
        bestScore = score;
        bestProvider = p;
      }
    }

    return bestProvider;
  }
}
