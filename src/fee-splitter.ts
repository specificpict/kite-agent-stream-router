export interface FeeDistributionReport {
  totalAmount: bigint;
  shares: { recipient: string; amount: bigint; bps: number }[];
  dustRefund: bigint;
}

export class FeeSplitDistributor {
  public static distribute(totalAmount: bigint, splits: { recipient: string; bps: number }[]): FeeDistributionReport {
    let disbursed = 0n;
    const shares = splits.map((s) => {
      const amount = (totalAmount * BigInt(s.bps)) / 10000n;
      disbursed += amount;
      return {
        recipient: s.recipient,
        amount,
        bps: s.bps,
      };
    });

    const dustRefund = totalAmount > disbursed ? totalAmount - disbursed : 0n;

    return {
      totalAmount,
      shares,
      dustRefund,
    };
  }
}
