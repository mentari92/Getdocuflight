/**
 * Nodemailer email notification service.
 *
 * Sends booking confirmations and status updates via SMTP.
 */

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        throw new Error("SMTP_USER and SMTP_PASS must be configured");
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });

    return transporter;
}

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const transport = getTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        await transport.sendMail({
            from: `GetDocuFlight <${from}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
        return true;
    } catch (error) {
        console.error("[Email] Failed:", error);
        return false;
    }
}

// ── Templates ──────────────────────────────────────────

export function bookingConfirmationEmail(booking: {
    id: string;
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    returnDate?: string | null;
    tripType: string;
    passengerCount: number;
    contactName: string;
}) {
    const returnInfo = booking.returnDate
        ? `<p><strong>Tanggal Pulang:</strong> ${new Date(booking.returnDate).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>`
        : "";

    return {
        subject: `✈️ Booking Confirmed — ${booking.departureCity} → ${booking.arrivalCity}`,
        html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Halo, ${booking.contactName}! 🎉</h2>
            <p style="color: #555;">Booking dummy ticket kamu sudah dikonfirmasi.</p>

            <div style="background: #f8f9ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p><strong>Booking ID:</strong> ${booking.id.slice(0, 8)}…</p>
                <p><strong>Rute:</strong> ${booking.departureCity} → ${booking.arrivalCity}</p>
                <p><strong>Tipe:</strong> ${booking.tripType === "ROUND_TRIP" ? "Pulang-Pergi" : "Sekali Jalan"}</p>
                <p><strong>Tanggal Berangkat:</strong> ${new Date(booking.departureDate).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
                ${returnInfo}
                <p><strong>Jumlah Penumpang:</strong> ${booking.passengerCount}</p>
            </div>

            <p style="color: #555; font-size: 13px;">
                Tim kami akan memproses dummy ticket kamu dan mengirimkannya dalam 1–2 jam kerja.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">
                GetDocuFlight — AI-powered visa preparation tool
            </p>
        </div>
        `,
        text: `Halo ${booking.contactName}! Booking dummy ticket kamu sudah dikonfirmasi. Rute: ${booking.departureCity} → ${booking.arrivalCity}. Booking ID: ${booking.id.slice(0, 8)}…`,
    };
}

export function deliveryNotificationEmail(booking: {
    id: string;
    departureCity: string;
    arrivalCity: string;
    contactName: string;
}) {
    return {
        subject: `✅ Ticket Ready — ${booking.departureCity} → ${booking.arrivalCity}`,
        html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Halo, ${booking.contactName}! 🚀</h2>
            <p style="color: #555;">Kabar baik! Dummy ticket kamu sudah siap dan telah diterbitkan.</p>

            <div style="background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p><strong>Booking ID:</strong> ${booking.id.slice(0, 8)}…</p>
                <p><strong>Rute:</strong> ${booking.departureCity} → ${booking.arrivalCity}</p>
                <p><strong>Status:</strong> <span style="color: #2f855a; font-weight: bold;">DELIVERED</span></p>
            </div>

            <p style="color: #555; font-size: 14px;">
                Silakan cek lampiran atau informasi detail di chat untuk mendapatkan nomor PNR kamu.
                Terima kasih telah menggunakan GetDocuFlight!
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">
                GetDocuFlight — AI-powered visa preparation tool
            </p>
        </div>
        `,
        text: `Halo ${booking.contactName}! Kabar baik! Dummy ticket kamu sudah siap (DELIVERED). Rute: ${booking.departureCity} → ${booking.arrivalCity}. Booking ID: ${booking.id.slice(0, 8)}…`,
    };
}

export function adminOrderAlertEmail(booking: {
    id: string;
    productType: string;
    amountUSD: number;
    amountIDR?: number;
    contactName: string;
    contactEmail: string;
    departureCity: string;
    arrivalCity: string;
}) {
    return {
        subject: `💰 NEW ORDER PAID — $${booking.amountUSD} (${booking.contactName})`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #2e7d32;">New Payment Received! 💰</h2>
            <p><strong>Customer:</strong> ${booking.contactName} (${booking.contactEmail})</p>
            <p><strong>Product:</strong> ${booking.productType}</p>
            <p><strong>Amount:</strong> $${booking.amountUSD} ${booking.amountIDR ? `(~Rp ${new Intl.NumberFormat("id-ID").format(booking.amountIDR)})` : ""}</p>
            <p><strong>Route:</strong> ${booking.departureCity} → ${booking.arrivalCity}</p>
            <p><strong>Booking ID:</strong> <code style="background: #eee; padding: 2px 4px;">${booking.id}</code></p>
            <hr />
            <p style="font-size: 14px; color: #666;">Silakan proses tiket ini segera melalui mitra bisnis Anda.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${booking.id}" 
               style="display: inline-block; background: #1a1a2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
               Buka Detail Pesanan
            </a>
        </div>
        `,
        text: `New Paid Order: $${booking.amountUSD} from ${booking.contactName}. Route: ${booking.departureCity} -> ${booking.arrivalCity}. ID: ${booking.id}`,
    };
}
