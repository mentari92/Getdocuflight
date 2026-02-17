/**
 * Rule-based scoring engine (Stage 1)
 *
 * 6 rules from PRD FR-03, base score 50, clamped 0–100.
 * Runs entirely locally — no API calls.
 */

import type { PredictorFormData } from "./predictor-schema";

// ── Types ──────────────────────────────────────────────────

export interface ScoringFactor {
    name: string;
    impact: "positive" | "neutral" | "negative";
    detail: string;
    points: number;
}

export interface ScoringResult {
    baseScore: number;
    factors: ScoringFactor[];
}

// ── Estimated trip costs (USD) by destination ──────────────

const TRIP_COST_ESTIMATES: Record<string, number> = {
    // Schengen
    france: 2500,
    germany: 2500,
    italy: 2500,
    spain: 2200,
    netherlands: 2500,
    switzerland: 3500,
    austria: 2500,
    belgium: 2500,
    portugal: 2200,
    greece: 2000,
    czech_republic: 2000,
    sweden: 3000,
    norway: 3500,
    denmark: 3000,
    finland: 3000,
    poland: 1800,
    // Non-Schengen
    japan: 3000,
    south_korea: 2500,
    united_kingdom: 3000,
    united_states: 4000,
    canada: 3500,
    australia: 4000,
    new_zealand: 4000,
};

const DEFAULT_TRIP_COST = 2500;

// Visa regions that grant +15 points
const STRONG_VISA_HISTORY = new Set([
    "schengen",
    "united_states",
    "united_kingdom",
    "japan",
    "australia",
    "canada",
]);

// ── Scoring Engine ─────────────────────────────────────────

export function calculateScore(input: PredictorFormData): ScoringResult {
    const factors: ScoringFactor[] = [];
    let score = 50; // neutral baseline

    // ── Rule 1: Prior strong visa history (+15) ──
    const hasStrongHistory = input.travelHistory.some((h) =>
        STRONG_VISA_HISTORY.has(h)
    );
    if (hasStrongHistory) {
        score += 15;
        const regions = input.travelHistory
            .filter((h) => STRONG_VISA_HISTORY.has(h))
            .join(", ");
        factors.push({
            name: "Riwayat Visa",
            impact: "positive",
            detail: `Pernah mendapat visa ke ${regions} — meningkatkan kredibilitas`,
            points: 15,
        });
    } else if (
        input.travelHistory.length === 1 &&
        input.travelHistory[0] === "none"
    ) {
        factors.push({
            name: "Riwayat Perjalanan",
            impact: "negative",
            detail: "Belum pernah bepergian ke luar negeri — mempengaruhi penilaian",
            points: 0,
        });
    } else {
        factors.push({
            name: "Riwayat Perjalanan",
            impact: "neutral",
            detail: "Riwayat perjalanan terbatas ke negara non-visa ketat",
            points: 0,
        });
    }

    // ── Rule 2: Employed full-time (+10) ──
    if (input.employmentStatus === "employed") {
        score += 10;
        factors.push({
            name: "Status Pekerjaan",
            impact: "positive",
            detail: "Karyawan tetap — menunjukkan ikatan kuat dengan negara asal",
            points: 10,
        });
    } else if (input.employmentStatus === "self_employed") {
        score += 5;
        factors.push({
            name: "Status Pekerjaan",
            impact: "neutral",
            detail: "Wiraswasta — perlu bukti pendapatan konsisten",
            points: 5,
        });
    } else if (input.employmentStatus === "student") {
        factors.push({
            name: "Status Pekerjaan",
            impact: "neutral",
            detail: "Pelajar — sponsor atau bukti keuangan keluarga penting",
            points: 0,
        });
    }

    // ── Rule 3: Bank balance ≥ 3× trip cost (+10) ──
    const tripCost =
        TRIP_COST_ESTIMATES[input.destination] ?? DEFAULT_TRIP_COST;
    const requiredBalance = tripCost * 3;

    if (input.bankBalance >= requiredBalance) {
        score += 10;
        factors.push({
            name: "Kondisi Keuangan",
            impact: "positive",
            detail: `Saldo bank memenuhi threshold ideal (≥ $${requiredBalance.toLocaleString()})`,
            points: 10,
        });
    } else if (input.bankBalance >= tripCost) {
        factors.push({
            name: "Kondisi Keuangan",
            impact: "neutral",
            detail: `Saldo cukup untuk perjalanan, tapi di bawah ideal (ideal: $${requiredBalance.toLocaleString()})`,
            points: 0,
        });
    } else {
        score -= 5;
        factors.push({
            name: "Kondisi Keuangan",
            impact: "negative",
            detail: `Saldo di bawah estimasi biaya perjalanan ($${tripCost.toLocaleString()})`,
            points: -5,
        });
    }

    // ── Rule 4: Prior visa refusal (−20) ──
    if (input.priorVisaRefusal === "yes") {
        score -= 20;
        factors.push({
            name: "Riwayat Penolakan",
            impact: "negative",
            detail: "Pernah ditolak visa — faktor risiko signifikan",
            points: -20,
        });
    } else {
        factors.push({
            name: "Riwayat Penolakan",
            impact: "positive",
            detail: "Tidak pernah ditolak visa — poin positif",
            points: 0,
        });
    }

    // ── Rule 5: Unemployed (−10) ──
    if (input.employmentStatus === "unemployed") {
        score -= 10;
        factors.push({
            name: "Status Pekerjaan",
            impact: "negative",
            detail: "Tidak bekerja — mempengaruhi penilaian kredibilitas",
            points: -10,
        });
    }

    // ── Rule 6: Same nationality as destination (special case) ──
    if (input.nationality === input.destination) {
        // Flag as unusual — likely not needing a visa
        factors.push({
            name: "Kewarganegaraan",
            impact: "neutral",
            detail: "Kewarganegaraan sama dengan negara tujuan — kemungkinan tidak memerlukan visa",
            points: 0,
        });
    }

    // Clamp to 0–100
    const baseScore = Math.max(0, Math.min(100, score));

    return { baseScore, factors };
}
