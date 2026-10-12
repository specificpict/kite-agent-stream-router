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
import { ReceiptVerifier } from "../src/index";

describe("Receipt Verifier Test Suite", () => {
  it("should record valid receipt and prevent replay attacks", () => {
    const verifier = new ReceiptVerifier();
    const receipt = {
      receiptId: "0xreceipt_test_abc",
      payer: "0x1111111111111111111111111111111111111111",
      totalAmount: 500000n,
      timestamp: Date.now(),
      nonce: 1n,
    };

    assert.strictEqual(verifier.verifyAndRegisterReceipt(receipt), true);
    assert.strictEqual(verifier.isReceiptExecuted("0xreceipt_test_abc"), true);

    assert.throws(() => {
      verifier.verifyAndRegisterReceipt(receipt);
    }, /Receipt replay detected/);
  });
});
import { ProviderHeartbeatMonitor } from "../src/index";

describe("Provider Heartbeat Monitor Suite", () => {
  it("should track provider liveness and detect timeout degradation", () => {
    const monitor = new ProviderHeartbeatMonitor(50n);
    const provider = "0x9999999999999999999999999999999999999999";

    monitor.recordHeartbeat(provider, 1000n);
    assert.strictEqual(monitor.assessHealth(provider, 1030n), true);
    assert.strictEqual(monitor.assessHealth(provider, 1060n), false); // Exceeded 50 slots
  });
});
import { FeeSplitDistributor } from "../src/index";

describe("Fee Split Distributor Suite", () => {
  it("should calculate exact distribution shares and account for dust", () => {
    const report = FeeSplitDistributor.distribute(10005n, [
      { recipient: "0x111", bps: 5000 },
      { recipient: "0x222", bps: 5000 },
    ]);

    assert.strictEqual(report.shares[0].amount, 5002n);
    assert.strictEqual(report.shares[1].amount, 5002n);
    assert.strictEqual(report.dustRefund, 1n); // 1 wei dust
  });
});
