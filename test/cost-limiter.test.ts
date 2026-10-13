import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StreamingCostLimiter } from "../src/cost-limiter";

describe("StreamingCostLimiter Suite", () => {
  it("allows consumption within epoch budget and rejects over-budget requests", () => {
    const limiter = new StreamingCostLimiter({
      maxAmountPerEpoch: 1000n,
      epochDurationMs: 5000
    });

    const client = "agent-requester-1";
    const t0 = 100000;

    assert.equal(limiter.checkBudget(client, 600n, t0).allowed, true);
    assert.equal(limiter.recordConsumption(client, 600n, t0), true);
    assert.equal(limiter.getConsumed(client), 600n);

    // Over remaining 400 budget
    assert.equal(limiter.checkBudget(client, 500n, t0).allowed, false);
    assert.equal(limiter.recordConsumption(client, 500n, t0), false);

    // Within remaining 400
    assert.equal(limiter.recordConsumption(client, 400n, t0), true);
    assert.equal(limiter.getConsumed(client), 1000n);

    // New epoch resets budget
    const t1 = t0 + 6000;
    assert.equal(limiter.checkBudget(client, 500n, t1).allowed, true);
    assert.equal(limiter.recordConsumption(client, 500n, t1), true);
    assert.equal(limiter.getConsumed(client), 500n);
  });
});
