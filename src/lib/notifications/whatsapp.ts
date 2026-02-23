/**
 * WhatsApp notification service.
 *
 * Strategy: Use wa.me deeplinks for MVP.
 * If WHATSAPP_API_TOKEN is configured, use the WhatsApp Business Cloud API.
 */

const WA_API_URL = "https://graph.facebook.com/v18.0";

interface WhatsAppSendResult {
    success: boolean;
    deeplink?: string;
    messageId?: string;
}

/**
 * Send a WhatsApp message.
 *
 * If the WhatsApp Business API is configured, send via API.
 * Otherwise, generate a wa.me deeplink for manual sending.
 */
export async function sendWhatsApp(
    phoneNumber: string,
    message: string
): Promise<WhatsAppSendResult> {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Clean phone number — remove +, spaces, dashes
    const cleanPhone = phoneNumber.replace(/[\s\-\+\(\)]/g, "");

    if (apiToken && phoneNumberId) {
        // Use WhatsApp Business Cloud API
        try {
            const response = await fetch(
                `${WA_API_URL}/${phoneNumberId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiToken}`,
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: cleanPhone,
                        type: "text",
                        text: { body: message },
                    }),
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("[WhatsApp API] Error:", errorBody);
                // Fallback to deeplink
                return {
                    success: false,
                    deeplink: generateDeeplink(cleanPhone, message),
                };
            }

            const data = await response.json();
            console.log(`[WhatsApp] Sent to ${cleanPhone}`);
            return {
                success: true,
                messageId: data.messages?.[0]?.id,
            };
        } catch (error) {
            console.error("[WhatsApp API] Failed:", error);
            return {
                success: false,
                deeplink: generateDeeplink(cleanPhone, message),
            };
        }
    }

    // Fallback: generate wa.me deeplink
    console.log(`[WhatsApp] API not configured, using deeplink for ${cleanPhone}`);
    return {
        success: false,
        deeplink: generateDeeplink(cleanPhone, message),
    };
}

function generateDeeplink(phone: string, message: string): string {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
}

// ── Templates ──────────────────────────────────────────

export function bookingConfirmationWA(booking: {
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
        `Reservasi tiket kamu sudah dikonfirmasi.`,
        ``,
        `📋 *Detail:*`,
        `• Rute: ${booking.departureCity} → ${booking.arrivalCity}`,
        `• Tanggal: ${new Date(booking.departureDate).toLocaleDateString("id-ID", { dateStyle: "long" })}`,
        `• ID: ${booking.id.slice(0, 8)}…`,
        ``,
        `Tim kami akan kirim tiket verifikasi dalam 1–2 jam kerja.`,
        ``,
        `— GetDocuFlight`,
    ].join("\n");
}

export function deliveryNotificationWA(booking: {
    id: string;
    departureCity: string;
    arrivalCity: string;
    contactName: string;
}) {
    return [
        `✅ *Ticket Ready!*`,
        ``,
        `Halo ${booking.contactName}!`,
        `Kabar baik! Reservasi tiket kamu sudah siap.`,
        ``,
        `📋 *Detail:*`,
        `• Rute: ${booking.departureCity} → ${booking.arrivalCity}`,
        `• Status: *DELIVERED*`,
        `• ID: ${booking.id.slice(0, 8)}…`,
        ``,
        `Silakan cek email kamu untuk mengunduh dokumen tiket dan detail PNR.`,
        ``,
        `Terima kasih!`,
        `— GetDocuFlight`,
    ].join("\n");
}
