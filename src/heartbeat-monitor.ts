export interface ProviderHeartbeat {
  provider: string;
  lastHeartbeatSlot: bigint;
  consecutiveTimeouts: number;
  isHealthy: boolean;
}

export class ProviderHeartbeatMonitor {
  private providers: Map<string, ProviderHeartbeat> = new Map();
  public readonly timeoutThresholdSlots: bigint;

  constructor(timeoutThresholdSlots: bigint = 50n) {
    this.timeoutThresholdSlots = timeoutThresholdSlots;
  }

  public recordHeartbeat(provider: string, currentSlot: bigint): void {
    const entry = this.providers.get(provider) || {
      provider,
      lastHeartbeatSlot: currentSlot,
      consecutiveTimeouts: 0,
      isHealthy: true,
    };
    entry.lastHeartbeatSlot = currentSlot;
    entry.consecutiveTimeouts = 0;
    entry.isHealthy = true;
    this.providers.set(provider, entry);
  }

  public assessHealth(provider: string, currentSlot: bigint): boolean {
    const entry = this.providers.get(provider);
    if (!entry) return false;

    if (currentSlot > entry.lastHeartbeatSlot + this.timeoutThresholdSlots) {
      entry.consecutiveTimeouts++;
      entry.isHealthy = false;
      return false;
    }
    return entry.isHealthy;
  }
}
