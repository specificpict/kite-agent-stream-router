export interface AgentEndpoint {
  address: string;
  endpointUri: string;
  feeRateWei: bigint;
  latencyMs: number;
  qualityScoreBps: number; // 0 - 10000
}

export class RouteCalculator {
  public selectOptimalEndpoint(endpoints: AgentEndpoint[]): AgentEndpoint {
    if (endpoints.length === 0) {
      throw new Error("No available endpoints for route calculation");
    }

    // Cost-Efficiency Score = (qualityScoreBps * 1000) / (latencyMs * Number(feeRateWei / 1000000000n + 1n))
    return endpoints.reduce((best, curr) => {
      const bestScore = this.computeScore(best);
      const currScore = this.computeScore(curr);
      return currScore > bestScore ? curr : best;
    });
  }

  public calculateSplitAmounts(totalAmount: bigint, splitBps: number[]): bigint[] {
    const totalBps = splitBps.reduce((acc, bps) => acc + bps, 0);
    if (totalBps !== 10000) {
      throw new Error("Invalid split: total basis points must equal exactly 10000 (100%)");
    }

    return splitBps.map((bps) => (totalAmount * BigInt(bps)) / 10000n);
  }

  private computeScore(ep: AgentEndpoint): number {
    const feeFactor = Number(ep.feeRateWei / 1000000000n) + 1;
    return (ep.qualityScoreBps * 1000) / (ep.latencyMs * feeFactor);
  }
}
