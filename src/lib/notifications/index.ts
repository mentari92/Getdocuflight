/**
 * Unified notification dispatcher.
 *
 * Routes notifications to the preferred channel (Email, WhatsApp, Telegram).
 * Falls back to email if the preferred channel fails.
 */

import {
    sendEmail,
    bookingConfirmationEmail,
    deliveryNotificationEmail,
    adminOrderAlertEmail
} from "./email";
import {
    sendWhatsApp,
    bookingConfirmationWA,
    deliveryNotificationWA
} from "./whatsapp";
import {
    sendTelegram,
    bookingConfirmationTG,
    deliveryNotificationTG,
    adminOrderAlertTG
} from "./telegram";

type NotifChannel = "EMAIL" | "WHATSAPP" | "TELEGRAM";

interface BookingNotifData {
    id: string;
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    returnDate?: string | null;
    tripType: string;
    passengerCount: number;
    contactName: string;
    contactEmail: string;
    contactWhatsApp?: string | null;
    contactTelegram?: string | null;
    preferredNotif: NotifChannel;
}

interface NotifResult {
    channel: NotifChannel;
    success: boolean;
    fallbackUsed: boolean;
    deeplink?: string; // For WhatsApp deeplink when API is not configured
}

type DeliveryNotifData = Pick<
    BookingNotifData,
    | "id"
    | "departureCity"
    | "arrivalCity"
    | "contactName"
    | "contactEmail"
    | "contactWhatsApp"
    | "contactTelegram"
    | "preferredNotif"
>;

/**
 * Send booking confirmation via the user's preferred notification channel.
 */
export async function sendBookingConfirmation(
    booking: BookingNotifData
): Promise<NotifResult> {
    const channel = booking.preferredNotif;

    // Try preferred channel first
    switch (channel) {
        case "WHATSAPP": {
            if (!booking.contactWhatsApp) {
                return await sendViaEmail(booking, "CONFIRMATION", true);
            }
            const message = bookingConfirmationWA(booking);
            const result = await sendWhatsApp(booking.contactWhatsApp, message);
            if (result.success) {
                return { channel: "WHATSAPP", success: true, fallbackUsed: false };
            }
            if (result.deeplink) {
                await sendViaEmail(booking, "CONFIRMATION", false);
                return {
                    channel: "WHATSAPP",
                    success: true,
                    fallbackUsed: false,
                    deeplink: result.deeplink,
                };
            }
            return await sendViaEmail(booking, "CONFIRMATION", true);
        }

        case "TELEGRAM": {
            if (!booking.contactTelegram) {
                return await sendViaEmail(booking, "CONFIRMATION", true);
            }
            const message = bookingConfirmationTG(booking);
            const result = await sendTelegram(booking.contactTelegram, message);
            if (result.success) {
                return { channel: "TELEGRAM", success: true, fallbackUsed: false };
            }
            return await sendViaEmail(booking, "CONFIRMATION", true);
        }

        case "EMAIL":
        default:
            return await sendViaEmail(booking, "CONFIRMATION", false);
    }
}

/**
 * Send delivery notification (Ticket Ready) via the user's preferred channel.
 */
export async function sendDeliveryNotification(
    booking: DeliveryNotifData
): Promise<NotifResult> {
    const channel = booking.preferredNotif;

    switch (channel) {
        case "WHATSAPP": {
            if (!booking.contactWhatsApp) {
                return await sendViaEmail(booking, "DELIVERY", true);
            }
            const message = deliveryNotificationWA(booking);
            const result = await sendWhatsApp(booking.contactWhatsApp, message);
            if (result.success) {
                return { channel: "WHATSAPP", success: true, fallbackUsed: false };
            }
            if (result.deeplink) {
                await sendViaEmail(booking, "DELIVERY", false);
                return {
                    channel: "WHATSAPP",
                    success: true,
                    fallbackUsed: false,
                    deeplink: result.deeplink,
                };
            }
            return await sendViaEmail(booking, "DELIVERY", true);
        }

        case "TELEGRAM": {
            if (!booking.contactTelegram) {
                return await sendViaEmail(booking, "DELIVERY", true);
            }
            const message = deliveryNotificationTG(booking);
            const result = await sendTelegram(booking.contactTelegram, message);
            if (result.success) {
                return { channel: "TELEGRAM", success: true, fallbackUsed: false };
            }
            return await sendViaEmail(booking, "DELIVERY", true);
        }

        case "EMAIL":
        default:
            return await sendViaEmail(booking, "DELIVERY", false);
    }
}

async function sendViaEmail(
    booking: BookingNotifData | DeliveryNotifData,
    type: "CONFIRMATION" | "DELIVERY",
    isFallback: boolean
): Promise<NotifResult> {
    const template =
        type === "CONFIRMATION"
            ? bookingConfirmationEmail(booking as BookingNotifData)
            : deliveryNotificationEmail(booking as DeliveryNotifData);

    const success = await sendEmail({
        to: booking.contactEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
    });

    return {
        channel: "EMAIL",
        success,
        fallbackUsed: isFallback,
    };
}

/**
 * Send an alert to the admin/owner about a new paid order.
 * This is triggered after payment is confirmed.
 */
export async function sendAdminAlert(booking: {
    id: string;
    productType: string;
    amountUSD: number;
    amountIDR?: number;
    contactName: string;
    contactEmail: string;
    departureCity: string;
    arrivalCity: string;
}): Promise<boolean> {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminTG = process.env.ADMIN_TELEGRAM_ID;

        const results = await Promise.all([
            // Email Admin
            adminEmail
                ? sendEmail({
                    to: adminEmail,
                    ...adminOrderAlertEmail(booking),
                })
                : Promise.resolve(false),

            // Telegram Admin
            adminTG
                ? sendTelegram(
                    adminTG,
                    adminOrderAlertTG(booking)
                )
                : Promise.resolve({ success: false } as { success: boolean }),
        ]);

        return results.some((r) => (typeof r === "boolean" ? r : r.success));
    } catch (error) {
        console.error("[Notif] Admin alert failed:", error);
        return false;
    }
}

