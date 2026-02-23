/**
 * Unit tests for DompetX payment integration.
 *
 * Tests cover:
 * - Webhook HMAC-SHA256 signature verification
 */

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

// Mock env BEFORE importing module
vi.stubEnv("DOMPETX_API_KEY", "test-api-key-123");
vi.stubEnv("DOMPETX_SECRET_KEY", "test-secret-key-456");
vi.stubEnv("DOMPETX_WEBHOOK_SECRET", "webhook-secret-789");
vi.stubEnv("DOMPETX_BASE_URL", "https://api.dompetx.test");

describe("DompetX webhook verification", () => {
    const WEBHOOK_SECRET = "webhook-secret-789";

    it("should verify a valid HMAC-SHA256 signature", async () => {
        const { verifyWebhookSignature } = await import("../dompetx");

        const body = JSON.stringify({
            event_id: "evt_123",
            payment_ref: "pay_456",
            status: "PAID",
        });

        // Generate valid signature
        const validSignature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(body)
            .digest("hex");

        expect(verifyWebhookSignature(body, validSignature)).toBe(true);
    });

    it("should reject an invalid signature", async () => {
        const { verifyWebhookSignature } = await import("../dompetx");

        const body = JSON.stringify({ event_id: "evt_123" });
        const invalidSignature = "definitely-not-valid";

        expect(verifyWebhookSignature(body, invalidSignature)).toBe(false);
    });

    it("should reject a tampered body", async () => {
        const { verifyWebhookSignature } = await import("../dompetx");

        const originalBody = JSON.stringify({ event_id: "evt_123" });
        const tamperedBody = JSON.stringify({ event_id: "evt_hacked" });

        const signature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(originalBody)
            .digest("hex");

        expect(verifyWebhookSignature(tamperedBody, signature)).toBe(false);
    });
});
