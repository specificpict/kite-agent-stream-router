import { describe, it } from "node:test";
import assert from "node:assert";
import { RouteCalculator, KiteAgentStreamRouterClient, AgentEndpoint } from "../src/index";

describe("Kite Agent Stream Router Test Suite", () => {
  const calculator = new RouteCalculator();

  it("should accurately select the most optimal agent endpoint based on latency and quality", () => {
    const endpoints: AgentEndpoint[] = [
      {
        address: "0x1111111111111111111111111111111111111111",
        endpointUri: "https://agent1.kite.ai/v1",
        feeRateWei: 1000000000n,
        latencyMs: 120,
        qualityScoreBps: 9000,
      },
      {
        address: "0x2222222222222222222222222222222222222222",
        endpointUri: "https://agent2.kite.ai/v1",
        feeRateWei: 1000000000n,
        latencyMs: 40, // Much lower latency with high quality
        qualityScoreBps: 9800,
      },
    ];

    const optimal = calculator.selectOptimalEndpoint(endpoints);
    assert.strictEqual(optimal.address, "0x2222222222222222222222222222222222222222");
  });

  it("should calculate exact atomic split payment distributions", () => {
    const totalAmount = 1000000n; // 1M wei
    const splits = [7000, 2000, 1000]; // 70%, 20%, 10%

    const amounts = calculator.calculateSplitAmounts(totalAmount, splits);
    assert.strictEqual(amounts[0], 700000n);
    assert.strictEqual(amounts[1], 200000n);
    assert.strictEqual(amounts[2], 100000n);
  });

  it("should prepare valid split route config via client", () => {
    const client = new KiteAgentStreamRouterClient(2368n);
    const route = client.prepareSplitRoute("0xreceipt123", 10000n, [
      { recipient: "0xaaa", bps: 8000 },
      { recipient: "0xbbb", bps: 2000 },
    ]);

    assert.strictEqual(route.recipients.length, 2);
    assert.strictEqual(route.totalAmount, 10000n);
  });
});
