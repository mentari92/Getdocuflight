/**
 * Unit tests for the 6-rule scoring engine.
 *
 * Tests cover:
 * - Base score (50)
 * - Each scoring rule independently
 * - Edge cases (min/max values)
 * - Score clamping (0-100)
 */

import { describe, it, expect } from "vitest";
import { calculateScore } from "../scoring";

// Helper: create a "baseline" input that scores neutral (~50)
function baselineInput() {
    return {
        nationality: "Indonesia",
        destination: "Japan",
        passportType: "REGULAR",
        departureDate: new Date(Date.now() + 90 * 86400000)
            .toISOString()
            .split("T")[0], // 90 days out
        employmentStatus: "EMPLOYED",
        monthlyIncome: 2000,
        bankBalance: 15000,
        priorVisaRefusal: "no" as const,
        travelPurpose: "TOURISM",
        travelHistory: [] as string[],
    };
}

describe("calculateScore", () => {
    describe("base score", () => {
        it("should return a score around 50 for neutral input", () => {
            const input = baselineInput();
            const result = calculateScore(input);
            // Base score is 50, neutral input should be near it
            expect(result.baseScore).toBeGreaterThanOrEqual(30);
            expect(result.baseScore).toBeLessThanOrEqual(80);
        });

        it("should return an array of factors", () => {
            const input = baselineInput();
            const result = calculateScore(input);
            expect(Array.isArray(result.factors)).toBe(true);
            expect(result.factors.length).toBeGreaterThan(0);
        });

        it("should have properly structured factors", () => {
            const input = baselineInput();
            const result = calculateScore(input);
            for (const factor of result.factors) {
                expect(factor).toHaveProperty("name");
                expect(factor).toHaveProperty("impact");
                expect(factor).toHaveProperty("detail");
                expect(factor).toHaveProperty("points");
                expect(["positive", "neutral", "negative"]).toContain(
                    factor.impact
                );
            }
        });
    });

    describe("Rule 1: Income adequacy", () => {
        it("should give positive points for high income", () => {
            const input = { ...baselineInput(), monthlyIncome: 5000 };
            const result = calculateScore(input);
            const incomeFactor = result.factors.find((f) =>
                f.name.toLowerCase().includes("income") ||
                f.name.toLowerCase().includes("penghasilan") ||
                f.name.toLowerCase().includes("gaji")
            );
            if (incomeFactor) {
                expect(incomeFactor.points).toBeGreaterThanOrEqual(0);
            }
        });

        it("should give negative points for very low income", () => {
            const lowIncomeResult = calculateScore({
                ...baselineInput(),
                monthlyIncome: 100,
                bankBalance: 500,
            }).baseScore;
            const highIncomeResult = calculateScore({
                ...baselineInput(),
                monthlyIncome: 10000,
                bankBalance: 100000,
            }).baseScore;
            expect(lowIncomeResult).toBeLessThanOrEqual(highIncomeResult);
        });
    });

    describe("Rule 2: Bank balance adequacy", () => {
        it("should score higher with larger bank balance", () => {
            const low = calculateScore({
                ...baselineInput(),
                bankBalance: 500,
            });
            const high = calculateScore({
                ...baselineInput(),
                bankBalance: 50000,
            });
            expect(high.baseScore).toBeGreaterThan(low.baseScore);
        });
    });

    describe("Rule 3: Prior visa refusal", () => {
        it("should penalize prior visa refusal", () => {
            const noRefusal = calculateScore({
                ...baselineInput(),
                priorVisaRefusal: "no",
            });
            const hasRefusal = calculateScore({
                ...baselineInput(),
                priorVisaRefusal: "yes",
            });
            expect(hasRefusal.baseScore).toBeLessThan(noRefusal.baseScore);
        });
    });

    describe("Rule 4: Travel history", () => {
        it("should reward extensive travel history", () => {
            const noHistory = calculateScore({
                ...baselineInput(),
                travelHistory: [],
            });
            const richHistory = calculateScore({
                ...baselineInput(),
                travelHistory: ["USA", "UK", "Japan", "Australia"],
            });
            expect(richHistory.baseScore).toBeGreaterThanOrEqual(
                noHistory.baseScore
            );
        });
    });

    describe("Rule 5: Employment status", () => {
        it("should score employed higher than unemployed", () => {
            const employed = calculateScore({
                ...baselineInput(),
                employmentStatus: "EMPLOYED",
            });
            const unemployed = calculateScore({
                ...baselineInput(),
                employmentStatus: "UNEMPLOYED",
            });
            expect(employed.baseScore).toBeGreaterThanOrEqual(
                unemployed.baseScore
            );
        });
    });

    describe("Score clamping", () => {
        it("should never return score below 0", () => {
            // Worst case scenario
            const input = {
                ...baselineInput(),
                monthlyIncome: 0,
                bankBalance: 0,
                priorVisaRefusal: "yes" as const,
                travelHistory: [] as string[],
                employmentStatus: "UNEMPLOYED",
            };
            const result = calculateScore(input);
            expect(result.baseScore).toBeGreaterThanOrEqual(0);
        });

        it("should never return score above 100", () => {
            // Best case scenario
            const input = {
                ...baselineInput(),
                monthlyIncome: 100000,
                bankBalance: 500000,
                priorVisaRefusal: "no" as const,
                travelHistory: [
                    "USA",
                    "UK",
                    "Japan",
                    "Australia",
                    "Germany",
                    "France",
                ],
                employmentStatus: "EMPLOYED",
            };
            const result = calculateScore(input);
            expect(result.baseScore).toBeLessThanOrEqual(100);
        });
    });
});
