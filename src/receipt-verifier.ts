export interface X402ReceiptSignature {
  receiptId: string;
  payer: string;
  totalAmount: bigint;
  timestamp: number;
  nonce: bigint;
}

export class ReceiptVerifier {
  private verifiedReceipts: Set<string> = new Set();

  public verifyAndRegisterReceipt(receipt: X402ReceiptSignature): boolean {
    if (this.verifiedReceipts.has(receipt.receiptId)) {
      throw new Error(`Receipt replay detected: ${receipt.receiptId}`);
    }

    if (receipt.totalAmount <= 0n) {
      throw new Error("Invalid receipt amount: must be positive");
    }

    this.verifiedReceipts.add(receipt.receiptId);
    return true;
  }

  public isReceiptExecuted(receiptId: string): boolean {
    return this.verifiedReceipts.has(receiptId);
  }
}
