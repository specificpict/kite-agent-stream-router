export interface CircuitBreakerConfig {
  failureThreshold: number; // consecutive failures before OPEN
  recoveryTimeoutMs: number; // cooldown before transitioning to HALF_OPEN
  maxHalfOpenAttempts: number;
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitMetrics {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
}

export class RouteCircuitBreaker {
  private config: CircuitBreakerConfig;
  private circuits: Map<string, CircuitMetrics> = new Map();

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      recoveryTimeoutMs: config?.recoveryTimeoutMs ?? 15000,
      maxHalfOpenAttempts: config?.maxHalfOpenAttempts ?? 2,
    };
  }

  public getCircuit(routeId: string): CircuitMetrics {
    let circuit = this.circuits.get(routeId);
    if (!circuit) {
      circuit = {
        state: "CLOSED",
        consecutiveFailures: 0,
        lastFailureTime: 0,
        halfOpenAttempts: 0,
      };
      this.circuits.set(routeId, circuit);
    }
    return circuit;
  }

  public isAvailable(routeId: string, currentTime: number = Date.now()): boolean {
    const circuit = this.getCircuit(routeId);

    if (circuit.state === "CLOSED") {
      return true;
    }

    if (circuit.state === "OPEN") {
      if (currentTime - circuit.lastFailureTime >= this.config.recoveryTimeoutMs) {
        circuit.state = "HALF_OPEN";
        circuit.halfOpenAttempts = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN
    return circuit.halfOpenAttempts < this.config.maxHalfOpenAttempts;
  }

  public recordSuccess(routeId: string): void {
    const circuit = this.getCircuit(routeId);
    circuit.state = "CLOSED";
    circuit.consecutiveFailures = 0;
    circuit.halfOpenAttempts = 0;
  }

  public recordFailure(routeId: string, currentTime: number = Date.now()): void {
    const circuit = this.getCircuit(routeId);
    circuit.consecutiveFailures += 1;
    circuit.lastFailureTime = currentTime;

    if (circuit.state === "HALF_OPEN") {
      circuit.state = "OPEN";
      circuit.halfOpenAttempts = 0;
    } else if (circuit.consecutiveFailures >= this.config.failureThreshold) {
      circuit.state = "OPEN";
    }
  }

  public reset(routeId: string): void {
    this.circuits.delete(routeId);
  }
}
