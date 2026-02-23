/**
 * Telegram notification service.
 *
 * Uses the Telegram Bot API to send messages.
 * Requires TELEGRAM_BOT_TOKEN env var.
 */

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramSendResult {
    success: boolean;
    messageId?: number;
}

/**
 * Send a Telegram message to a user/group.
 *
 * @param chatId - Telegram chat ID or @username
 * @param message - Message text (supports Markdown V2)
 */
export async function sendTelegram(
    chatId: string,
    message: string
): Promise<TelegramSendResult> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        console.warn("[Telegram] TELEGRAM_BOT_TOKEN not configured");
        return { success: false };
    }

    try {
        const response = await fetch(
            `${TELEGRAM_API}/bot${botToken}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId.startsWith("@") ? chatId : chatId,
                    text: message,
                    parse_mode: "Markdown",
                }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("[Telegram] API Error:", errorBody);
            return { success: false };
        }

        const data = await response.json();
        console.log(`[Telegram] Sent to ${chatId}`);
        return {
            success: true,
            messageId: data.result?.message_id,
        };
    } catch (error) {
        console.error("[Telegram] Failed:", error);
        return { success: false };
    }
}

// ── Templates ──────────────────────────────────────────

export function bookingConfirmationTG(booking: {
    id: string;
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    contactName: string;
}) {
    return [
        `✈️ *Booking Dikonfirmasi*`,
        ``,
        `Halo ${booking.contactName}!`,
        `Dummy ticket kamu sudah dikonfirmasi.`,
        ``,
        `📋 *Detail:*`,
        `• Rute: ${booking.departureCity} → ${booking.arrivalCity}`,
        `• Tanggal: ${new Date(booking.departureDate).toLocaleDateString("id-ID", { dateStyle: "long" })}`,
        `• ID: \`${booking.id.slice(0, 8)}…\``,
        ``,
        `Tim kami akan kirim dummy ticket dalam 1–2 jam kerja.`,
        ``,
        `— _GetDocuFlight_`,
    ].join("\n");
}

export function deliveryNotificationTG(booking: {
    id: string;
    departureCity: string;
    arrivalCity: string;
    contactName: string;
}) {
    return [
        `✅ *Ticket Ready!*`,
        ``,
        `Halo ${booking.contactName}!`,
        `Kabar baik! Dummy ticket kamu sudah siap.`,
        ``,
        `📋 *Detail:*`,
        `• Rute: ${booking.departureCity} → ${booking.arrivalCity}`,
        `• Status: *DELIVERED*`,
        `• ID: \`${booking.id.slice(0, 8)}…\``,
        ``,
        `Silakan cek email kamu untuk mengunduh dokumen tiket dan detail PNR.`,
        ``,
        `Terima kasih!`,
        `— _GetDocuFlight_`,
    ].join("\n");
}

export function adminOrderAlertTG(booking: {
    id: string;
    productType: string;
    amountUSD: number;
    amountIDR?: number;
    contactName: string;
    contactEmail: string;
    departureCity: string;
    arrivalCity: string;
}) {
    return [
        `💰 *NEW ORDER PAID*`,
        ``,
        `Pelanggan: ${booking.contactName}`,
        `Produk: ${booking.productType}`,
        `Nominal: $${booking.amountUSD} ${booking.amountIDR ? `(~IDR ${new Intl.NumberFormat("id-ID").format(booking.amountIDR)})` : ""}`,
        `Rute: ${booking.departureCity} → ${booking.arrivalCity}`,
        ``,
        `ID: \`${booking.id}\``,
        ``,
        `🚀 _Silakan segera proses tiket ini._`,
    ].join("\n");
}
