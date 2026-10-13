import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DynamicLoadBalancer } from "../src/load-balancer";

describe("DynamicLoadBalancer Suite", () => {
  it("prioritizes provider with higher success rate and lower latency", () => {
    const balancer = new DynamicLoadBalancer({
      latencyWeight: 0.5,
      successRateWeight: 0.5,
      windowSize: 5
    });

    const fastReliable = "0xfast11111111111111111111111111111111111";
    const slowUnreliable = "0xslow22222222222222222222222222222222222";

    // Feed feedbacks
    for (let i = 0; i < 5; i++) {
      balancer.recordFeedback({
        provider: fastReliable,
        latencyMs: 50,
        success: true,
        timestamp: Date.now()
      });

      balancer.recordFeedback({
        provider: slowUnreliable,
        latencyMs: 500,
        success: i % 2 === 0, // 60% success
        timestamp: Date.now()
      });
    }

    const scoreFast = balancer.getScore(fastReliable);
    const scoreSlow = balancer.getScore(slowUnreliable);

    assert.ok(scoreFast.compositeScore > scoreSlow.compositeScore);
    assert.equal(balancer.selectBestProvider([fastReliable, slowUnreliable]), fastReliable);
  });
});
