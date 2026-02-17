import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "fx:USD:IDR";
const CACHE_TTL = 3600; // 1 hour

interface ExchangeRateResponse {
    data: {
        IDR: number;
    };
}

/**
 * Fetch USD→IDR exchange rate from freecurrencyapi.com.
 * Result is cached in Redis with 1-hour TTL.
 */
export async function getExchangeRate(): Promise<number> {
    // Check Redis cache first
    const cached = await cacheGet<number>(CACHE_KEY);
    if (cached !== null) {
        return cached;
    }

    // Fetch from freecurrencyapi.com
    const apiKey = process.env.FREECURRENCY_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
        throw new Error(
            "FREECURRENCY_API_KEY is not configured. Please set it in .env"
        );
    }

    // NOTE: freecurrencyapi.com only supports API key via query parameter (no Auth header).
    // Ensure server access logs strip query strings in production to avoid key exposure.
    const url = `https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&currencies=IDR&base_currency=USD`;

    const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 }, // Don't use Next.js fetch cache — we manage our own via Redis
    });

    if (!response.ok) {
        throw new Error(
            `freecurrencyapi.com returned ${response.status}: ${response.statusText}`
        );
    }

    const json = (await response.json()) as ExchangeRateResponse;
    const rate = json.data.IDR;

    if (!rate || typeof rate !== "number" || rate <= 0) {
        throw new Error("Invalid exchange rate received from freecurrencyapi.com");
    }

    // Cache in Redis
    await cacheSet(CACHE_KEY, rate, CACHE_TTL);

    return rate;
}

/**
 * Convert a USD amount to IDR using live exchange rate.
 * @param usdAmount - Amount in USD (e.g. 5.00)
 * @returns Object with amountIDR (rounded to nearest integer) and exchangeRate used
 */
export async function getIDRAmount(usdAmount: number): Promise<{
    amountIDR: number;
    exchangeRate: number;
}> {
    const exchangeRate = await getExchangeRate();
    const amountIDR = Math.round(usdAmount * exchangeRate);

    return { amountIDR, exchangeRate };
}
