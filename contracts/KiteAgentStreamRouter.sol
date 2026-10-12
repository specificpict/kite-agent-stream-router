// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/**
 * @title KiteAgentStreamRouter
 * @notice High-throughput on-chain payment routing & multi-agent workload dispatcher protocol on Kite Chain.
 */
contract KiteAgentStreamRouter {
    struct ProviderRoute {
        address providerAddress;
        string endpointUri;
        uint256 feeRateWei;
        uint16 qualityScoreBps; // 0 - 10000 bps
        bool isActive;
    }

    address public owner;
    uint256 public totalRoutesExecuted;
    mapping(address => ProviderRoute) public providers;
    mapping(bytes32 => bool) public executedReceipts;

    event ProviderRegistered(address indexed provider, string endpointUri, uint256 feeRateWei, uint16 qualityScoreBps);
    event RoutePaymentDispatched(bytes32 indexed receiptId, address indexed payer, uint256 totalAmount, uint256 recipientCount);
    event ProviderStatusUpdated(address indexed provider, bool isActive);

    error Unauthorized();
    error InvalidRecipientCount();
    error BpsSumMismatch();
    error ReplayReceipt();
    error TransferFailed();
    error ProviderNotActive();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerProvider(string calldata endpointUri, uint256 feeRateWei, uint16 qualityScoreBps) external {
        providers[msg.sender] = ProviderRoute({
            providerAddress: msg.sender,
            endpointUri: endpointUri,
            feeRateWei: feeRateWei,
            qualityScoreBps: qualityScoreBps,
            isActive: true
        });

        emit ProviderRegistered(msg.sender, endpointUri, feeRateWei, qualityScoreBps);
    }

    function setProviderStatus(address provider, bool isActive) external onlyOwner {
        providers[provider].isActive = isActive;
        emit ProviderStatusUpdated(provider, isActive);
    }

    function dispatchSplitPayment(
        bytes32 receiptId,
        address[] calldata recipients,
        uint16[] calldata splitBps
    ) external payable {
        if (recipients.length == 0 || recipients.length != splitBps.length) revert InvalidRecipientCount();
        if (executedReceipts[receiptId]) revert ReplayReceipt();

        executedReceipts[receiptId] = true;
        totalRoutesExecuted++;

        uint256 totalBps = 0;
        uint256 totalDisbursed = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            totalBps += splitBps[i];
            uint256 share = (msg.value * splitBps[i]) / 10000;
            totalDisbursed += share;

            (bool success, ) = payable(recipients[i]).call{value: share}("");
            if (!success) revert TransferFailed();
        }

        if (totalBps != 10000) revert BpsSumMismatch();

        // Refund any dust back to sender
        if (msg.value > totalDisbursed) {
            payable(msg.sender).transfer(msg.value - totalDisbursed);
        }

        emit RoutePaymentDispatched(receiptId, msg.sender, msg.value, recipients.length);
    }
}
