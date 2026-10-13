export interface CostBudgetRule {
  maxAmountPerEpoch: bigint;
  epochDurationMs: number;
}

export interface ClientBudgetState {
  clientId: string;
  epochStartMs: number;
  consumedAmount: bigint;
}

export class StreamingCostLimiter {
  private clientStates: Map<string, ClientBudgetState> = new Map();
  private defaultRule: CostBudgetRule;

  constructor(defaultRule?: Partial<CostBudgetRule>) {
    this.defaultRule = {
      maxAmountPerEpoch: defaultRule?.maxAmountPerEpoch ?? 10_000_000n, // e.g. 10 tokens / units
      epochDurationMs: defaultRule?.epochDurationMs ?? 60_000 // 1 minute
    };
  }

  public checkBudget(clientId: string, requestedCost: bigint, currentTime: number = Date.now()): { allowed: boolean; remainingBudget: bigint } {
    let state = this.clientStates.get(clientId);

    if (!state || currentTime - state.epochStartMs >= this.defaultRule.epochDurationMs) {
      state = {
        clientId,
        epochStartMs: currentTime,
        consumedAmount: 0n
      };
      this.clientStates.set(clientId, state);
    }

    const projected = state.consumedAmount + requestedCost;
    if (projected > this.defaultRule.maxAmountPerEpoch) {
      const remaining = this.defaultRule.maxAmountPerEpoch > state.consumedAmount
        ? this.defaultRule.maxAmountPerEpoch - state.consumedAmount
        : 0n;
      return { allowed: false, remainingBudget: remaining };
    }

    return {
      allowed: true,
      remainingBudget: this.defaultRule.maxAmountPerEpoch - projected
    };
  }

  public recordConsumption(clientId: string, cost: bigint, currentTime: number = Date.now()): boolean {
    const check = this.checkBudget(clientId, cost, currentTime);
    if (!check.allowed) {
      return false;
    }

    const state = this.clientStates.get(clientId)!;
    state.consumedAmount += cost;
    return true;
  }

  public getConsumed(clientId: string): bigint {
    return this.clientStates.get(clientId)?.consumedAmount ?? 0n;
  }
}
