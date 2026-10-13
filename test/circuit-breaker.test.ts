import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RouteCircuitBreaker } from "../src/circuit-breaker";

describe("RouteCircuitBreaker Suite", () => {
  it("trips to OPEN state after exceeding failure threshold and recovers after timeout", () => {
    const breaker = new RouteCircuitBreaker({
      failureThreshold: 3,
      recoveryTimeoutMs: 1000,
      maxHalfOpenAttempts: 2
    });

    const route = "endpoint-model-alpha";
    const now = 100000;

    assert.equal(breaker.isAvailable(route, now), true);

    // 2 failures
    breaker.recordFailure(route, now + 10);
    breaker.recordFailure(route, now + 20);
    assert.equal(breaker.isAvailable(route, now + 20), true);

    // 3rd failure trips
    breaker.recordFailure(route, now + 30);
    assert.equal(breaker.isAvailable(route, now + 40), false);
    assert.equal(breaker.getCircuit(route).state, "OPEN");

    // Before recovery timeout
    assert.equal(breaker.isAvailable(route, now + 900), false);

    // After recovery timeout -> transitions to HALF_OPEN
    assert.equal(breaker.isAvailable(route, now + 1100), true);
    assert.equal(breaker.getCircuit(route).state, "HALF_OPEN");

    // Success resets to CLOSED
    breaker.recordSuccess(route);
    assert.equal(breaker.getCircuit(route).state, "CLOSED");
    assert.equal(breaker.getCircuit(route).consecutiveFailures, 0);
  });
});
