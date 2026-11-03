export class StreamBandwidthThrottle {
  private capacity: number;
  private availableTokens: number;
  private refillRatePerSec: number;
  private lastRefill: number;

  constructor(capacity = 1048576, refillRatePerSec = 262144) {
    this.capacity = capacity;
    this.availableTokens = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.lastRefill = Date.now();
  }

  public allowBytes(bytes: number): boolean {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.availableTokens = Math.min(this.capacity, this.availableTokens + elapsedSeconds * this.refillRatePerSec);
    this.lastRefill = now;

    if (this.availableTokens >= bytes) {
      this.availableTokens -= bytes;
      return true;
    }
    return false;
  }
}
