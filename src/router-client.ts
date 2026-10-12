import { RouteCalculator, AgentEndpoint } from "./route-calculator";

export interface SplitRouteConfig {
  receiptId: string;
  totalAmount: bigint;
  recipients: string[];
  splitBps: number[];
}

export class KiteAgentStreamRouterClient {
  public readonly calculator: RouteCalculator;
  public readonly chainId: bigint;

  constructor(chainId: bigint = 2368n) {
    this.calculator = new RouteCalculator();
    this.chainId = chainId;
  }

  public prepareSplitRoute(receiptId: string, totalAmount: bigint, splits: { recipient: string; bps: number }[]): SplitRouteConfig {
    const recipients = splits.map((s) => s.recipient);
    const splitBps = splits.map((s) => s.bps);

    // Validate splits
    this.calculator.calculateSplitAmounts(totalAmount, splitBps);

    return {
      receiptId,
      totalAmount,
      recipients,
      splitBps,
    };
  }
}
