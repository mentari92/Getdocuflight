import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/notifications/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        // 1. Save to Database
        const contactMessage = await (prisma as any).contactMessage.create({
            data: {
                name,
                email,
                subject,
                message,
            },
        });

        // 2. Log to Console
        console.log("CONTACT FORM SUBMISSION SAVED:", contactMessage.id);

        // 3. Send Email Alert to Admin (Optional/Conditional)
        const adminEmail = process.env.SMTP_USER || "getdocuflight@gmail.com";
        await sendEmail({
            to: adminEmail,
            subject: `📧 New Contact Message: ${subject}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #1a1a2e;">New Message from Contact Form 📩</h2>
                    <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="white-space: pre-wrap;">${message}</p>
                    </div>
                    <hr />
                    <p style="font-size: 14px; color: #666;">View this message in the Admin Dashboard.</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/messages" 
                       style="display: inline-block; background: #c6940e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                       Go to Admin Dashboard
                    </a>
                </div>
            `,
            text: `New Message from ${name} (${email}): ${subject}\n\n${message}`,
        });

        return NextResponse.json({ success: true, message: "Message received" });
    } catch (error) {
        console.error("CONTACT API ERROR:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
