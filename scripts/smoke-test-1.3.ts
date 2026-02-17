/**
 * Story 1.3 Smoke Test
 *
 * Tests: Redis cache, getIDRAmount, HMAC verification, webhook E2E
 *
 * Prerequisites: Docker (postgres + redis) running, `npx prisma db push` done
 * Run: npx tsx scripts/smoke-test-1.3.ts
 */

// Set test env vars BEFORE any lib imports (they validate on import)
process.env.DOMPETX_WEBHOOK_SECRET = "smoke-test-webhook-secret-32chars!";
process.env.DOMPETX_API_KEY = "smoke-test-api-key";
process.env.DOMPETX_BASE_URL = "https://sandbox.dompetx.com/api/v1";

import crypto from "crypto";

// ── Direct Redis test (no lib imports — validate raw connection) ──

async function testRedisCache() {
    console.log("\n═══ TEST 1: Redis Cache Operations ═══");

    const { cacheGet, cacheSet, cacheExists, cacheDelete } = await import(
        "../src/lib/cache"
    );

    // Set
    await cacheSet("test:smoke", { hello: "world", ts: Date.now() }, 60);
    console.log("  ✅ cacheSet — wrote test:smoke");

    // Get
    const value = await cacheGet<{ hello: string; ts: number }>("test:smoke");
    if (!value || value.hello !== "world") {
        throw new Error(`cacheGet returned unexpected: ${JSON.stringify(value)}`);
    }
    console.log("  ✅ cacheGet — read back:", JSON.stringify(value));

    // Exists
    const exists = await cacheExists("test:smoke");
    if (!exists) throw new Error("cacheExists returned false for existing key");
    console.log("  ✅ cacheExists — confirmed key exists");

    // Delete
    await cacheDelete("test:smoke");
    const afterDelete = await cacheGet("test:smoke");
    if (afterDelete !== null) throw new Error("cacheDelete did not remove key");
    console.log("  ✅ cacheDelete — key removed");

    console.log("  ✅ TEST 1 PASSED\n");
}

// ── getIDRAmount test (seed rate in Redis, bypass API) ──

async function testGetIDRAmount() {
    console.log("═══ TEST 2: getIDRAmount(5.00) with Cached Rate ═══");

    const { cacheSet, cacheGet } = await import("../src/lib/cache");

    // Seed a known exchange rate into Redis (simulating freecurrencyapi response)
    const mockRate = 16250.5;
    await cacheSet("fx:USD:IDR", mockRate, 3600);
    console.log(`  ✅ Seeded fx:USD:IDR = ${mockRate} (TTL 1h)`);

    // Now call getIDRAmount — it should use cached rate
    const { getIDRAmount } = await import("../src/lib/currency");
    const result = await getIDRAmount(5.0);

    console.log(`  ✅ getIDRAmount(5.00) = ${JSON.stringify(result)}`);

    // Validate
    const expectedIDR = Math.round(5.0 * mockRate);
    if (result.exchangeRate !== mockRate) {
        throw new Error(
            `Expected exchangeRate ${mockRate}, got ${result.exchangeRate}`
        );
    }
    if (result.amountIDR !== expectedIDR) {
        throw new Error(
            `Expected amountIDR ${expectedIDR}, got ${result.amountIDR}`
        );
    }

    // Verify the key is still in Redis
    const cachedRate = await cacheGet<number>("fx:USD:IDR");
    if (cachedRate !== mockRate) {
        throw new Error("fx:USD:IDR not found in Redis after getIDRAmount call");
    }
    console.log("  ✅ Redis cache key fx:USD:IDR confirmed present");

    console.log("  ✅ TEST 2 PASSED\n");
}

// ── HMAC Verification test ──

async function testHMACVerification() {
    console.log("═══ TEST 3: HMAC Signature Verification ═══");

    const { verifyWebhookSignature } = await import("../src/lib/dompetx");

    const testBody = JSON.stringify({
        event_id: "evt_test_123",
        payment_ref: "pay_test_456",
        status: "PAID",
    });

    const secret = process.env.DOMPETX_WEBHOOK_SECRET!;
    const validSignature = crypto
        .createHmac("sha256", secret)
        .update(testBody, "utf8")
        .digest("hex");

    // Valid signature should pass
    const isValid = verifyWebhookSignature(testBody, validSignature);
    if (!isValid) throw new Error("Valid HMAC signature was rejected");
    console.log("  ✅ Valid HMAC signature accepted");

    // Invalid signature should fail
    const isInvalid = verifyWebhookSignature(testBody, "deadbeef".repeat(8));
    if (isInvalid) throw new Error("Invalid HMAC signature was accepted");
    console.log("  ✅ Invalid HMAC signature rejected");

    // Tampered body should fail
    const tamperedBody = testBody.replace("PAID", "TAMPERED");
    const isTampered = verifyWebhookSignature(tamperedBody, validSignature);
    if (isTampered) throw new Error("Tampered body signature was accepted");
    console.log("  ✅ Tampered body rejected");

    console.log("  ✅ TEST 3 PASSED\n");
}

// ── Webhook E2E test (seed order → POST webhook → check isPaid) ──

async function testWebhookE2E() {
    console.log("═══ TEST 4 & 5: Webhook E2E + Idempotency ═══");

    const { prisma } = await import("../src/lib/db");
    const { cacheDelete } = await import("../src/lib/cache");

    // Find or create a test user
    let user = await prisma.user.findFirst({
        where: { email: "smoke-test@docuflight.com" },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: "smoke-test@docuflight.com",
                name: "Smoke Test User",
                password: "not-a-real-password", // Not used for login
            },
        });
    }
    console.log(`  ✅ Test user: ${user.email} (${user.id})`);

    // Create a test prediction
    const prediction = await prisma.prediction.create({
        data: {
            userId: user.id,
            fromCountry: "indonesia",
            toCountry: "japan",
            inputData: { test: true },
            inputHash: `smoke_${Date.now()}`,
            approvalScore: 65,
            riskLevel: "MEDIUM",
            teaser: "Smoke test teaser",
            recommendation: "Smoke test recommendation",
            recommendationSummary: ["Point 1"],
            factors: [{ name: "Test", impact: "neutral", detail: "Smoke test" }],
            isPaid: false,
        },
    });
    console.log(`  ✅ Test prediction: ${prediction.id} (isPaid: false)`);

    // Create a test order linked to prediction
    const paymentRef = `pay_smoke_${Date.now()}`;
    const order = await prisma.order.create({
        data: {
            userId: user.id,
            productType: "AI_PREDICTION",
            amountUSD: 5.0,
            amountIDR: 81252,
            exchangeRate: 16250.5,
            paymentGateway: "DOMPETX",
            paymentRef: paymentRef,
            status: "PENDING",
            predictions: {
                connect: { id: prediction.id },
            },
        },
    });
    console.log(`  ✅ Test order: ${order.id} (status: PENDING, ref: ${paymentRef})`);

    // Build webhook payload
    const eventId = `evt_smoke_${Date.now()}`;
    const webhookBody = JSON.stringify({
        event_id: eventId,
        event_type: "payment.success",
        payment_ref: paymentRef,
        external_id: order.id,
        amount: 81252,
        status: "PAID",
        paid_at: new Date().toISOString(),
    });

    // Generate valid HMAC signature
    const secret = process.env.DOMPETX_WEBHOOK_SECRET!;
    const signature = crypto
        .createHmac("sha256", secret)
        .update(webhookBody, "utf8")
        .digest("hex");

    // Send webhook to local server
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    // Detect which port the dev server is on
    const port = process.env.PORT || 3001;
    const webhookUrl = `http://localhost:${port}/api/payments/webhooks/dompetx`;

    console.log(`  → Sending webhook to ${webhookUrl}...`);

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-dompetx-signature": signature,
        },
        body: webhookBody,
    });

    const responseBody = await response.json();
    console.log(`  → Response: ${response.status} ${JSON.stringify(responseBody)}`);

    if (response.status !== 200) {
        throw new Error(`Webhook returned ${response.status}: ${JSON.stringify(responseBody)}`);
    }
    console.log("  ✅ Webhook returned 200");

    // Verify Order status changed to PAID
    const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
    });
    if (updatedOrder?.status !== "PAID") {
        throw new Error(
            `Order status expected PAID, got ${updatedOrder?.status}`
        );
    }
    console.log("  ✅ Order.status = PAID");

    // Verify Prediction.isPaid = true
    const updatedPrediction = await prisma.prediction.findUnique({
        where: { id: prediction.id },
    });
    if (!updatedPrediction?.isPaid) {
        throw new Error(
            `Prediction.isPaid expected true, got ${updatedPrediction?.isPaid}`
        );
    }
    console.log("  ✅ Prediction.isPaid = true");

    if (!updatedPrediction?.uploadWindowExpiresAt) {
        throw new Error("Prediction.uploadWindowExpiresAt not set");
    }
    console.log(
        `  ✅ Prediction.uploadWindowExpiresAt = ${updatedPrediction.uploadWindowExpiresAt.toISOString()}`
    );

    // ── TEST 5: Idempotency ──
    console.log("\n  → Sending same webhook again (idempotency test)...");
    const response2 = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-dompetx-signature": signature,
        },
        body: webhookBody,
    });
    const responseBody2 = await response2.json();
    console.log(`  → Response: ${response2.status} ${JSON.stringify(responseBody2)}`);

    if (response2.status !== 200) {
        throw new Error(`Idempotent replay returned ${response2.status}`);
    }
    if (!responseBody2.message?.includes("already processed")) {
        throw new Error(
            `Expected 'already processed' message, got: ${responseBody2.message}`
        );
    }
    console.log("  ✅ Duplicate event correctly skipped (idempotent)");

    // Cleanup: remove test data
    await prisma.prediction.delete({ where: { id: prediction.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await cacheDelete(`webhook:dompetx:${eventId}`);
    console.log("  ✅ Test data cleaned up");

    console.log("  ✅ TEST 4 & 5 PASSED\n");
}

// ── Main runner ──

async function main() {
    console.log("╔════════════════════════════════════════════╗");
    console.log("║   Story 1.3 — Payment Infrastructure      ║");
    console.log("║   Smoke Test                               ║");
    console.log("╚════════════════════════════════════════════╝");

    try {
        await testRedisCache();
        await testGetIDRAmount();
        await testHMACVerification();
        await testWebhookE2E();

        console.log("╔════════════════════════════════════════════╗");
        console.log("║   ALL 5 TESTS PASSED ✅                    ║");
        console.log("╚════════════════════════════════════════════╝\n");
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
        process.exit(1);
    } finally {
        // Close connections
        const redis = (await import("../src/lib/redis")).default;
        await redis.quit();
        const { prisma } = await import("../src/lib/db");
        await prisma.$disconnect();
    }
}

main();
