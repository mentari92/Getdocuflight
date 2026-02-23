import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import CopyPassengerData from "@/components/admin/CopyPassengerData";
import StatusUpdateButton from "@/components/admin/StatusUpdateButton";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return {
        title: `Order ${id.slice(0, 8)}… — Admin`,
        description: "Admin order detail view.",
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: "📝" },
    PENDING_PAYMENT: { label: "Awaiting Payment", color: "bg-yellow-50 text-yellow-700", icon: "⏳" },
    PAID: { label: "Paid", color: "bg-blue-50 text-blue-700", icon: "💳" },
    PROCESSING: { label: "Processing", color: "bg-indigo-50 text-indigo-700", icon: "⚙️" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-50 text-emerald-700", icon: "📨" },
    COMPLETED: { label: "Completed", color: "bg-green-50 text-green-700", icon: "✅" },
    CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-700", icon: "❌" },
};

export default async function AdminOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            passengers: true,
            user: { select: { name: true, email: true } },
            order: true,
        },
    });

    if (!booking) notFound();

    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.DRAFT;
    const depDate = booking.departureDate.toLocaleDateString("en-US", { dateStyle: "long" });
    const retDate = booking.returnDate
        ? booking.returnDate.toLocaleDateString("en-US", { dateStyle: "long" })
        : null;

    const route = `${booking.departureCity} → ${booking.arrivalCity}`;
    const isBundle = booking.productType === "DUMMY_BUNDLE";

    return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link href="/admin/orders" className="text-muted hover:text-primary transition-colors">
                    ← All Orders
                </Link>
                <span className="text-muted">/</span>
                <span className="text-heading font-medium">{id.slice(0, 8)}…</span>
            </div>

            {/* Status Banner */}
            <div className={`${status.color} rounded-2xl p-5 text-center`}>
                <span className="text-3xl block mb-2">{status.icon}</span>
                <h2 className="text-lg font-bold font-heading">{status.label}</h2>
                <p className="text-xs mt-1 opacity-80 font-mono">{booking.id}</p>
            </div>

            {/* Product Type */}
            <div className="bg-surface/50 rounded-2xl p-5 text-center">
                <p className="text-sm font-bold text-heading">
                    {isBundle ? "✈️🏨 Bundle: Flight + Hotel" : "✈️ Dummy Flight Ticket"}
                </p>
                {booking.amountUSD && (
                    <p className="text-lg font-extrabold text-primary mt-1">
                        ${booking.amountUSD.toFixed(2)} USD
                    </p>
                )}
            </div>

            {/* Flight Details */}
            <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-heading uppercase">Flight Details</h3>
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-lg font-bold text-heading">{booking.departureCity.split(" (")[0]}</p>
                        <p className="text-xs text-muted">{booking.departureCity}</p>
                    </div>
                    <div className="flex-1 flex items-center">
                        <div className="flex-1 h-px bg-gold-border" />
                        <span className="px-2 text-muted">✈️</span>
                        <div className="flex-1 h-px bg-gold-border" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-heading">{booking.arrivalCity.split(" (")[0]}</p>
                        <p className="text-xs text-muted">{booking.arrivalCity}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted">Departure</p>
                        <p className="font-medium text-heading">{depDate}</p>
                    </div>
                    {retDate && (
                        <div>
                            <p className="text-xs text-muted">Return</p>
                            <p className="font-medium text-heading">{retDate}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-muted">Type</p>
                        <p className="font-medium text-heading">
                            {booking.tripType === "ROUND_TRIP" ? "Round Trip" : "One Way"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Source</p>
                        <p className="font-medium text-heading">
                            {booking.source === "CHATBOT" ? "🤖 Chatbot" : "📝 Form"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Hotel Details (bundle only) */}
            {isBundle && booking.hotelCity && (
                <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-heading uppercase">Hotel Details</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-muted">City</p>
                            <p className="font-medium text-heading">{booking.hotelCity}</p>
                        </div>
                        {booking.hotelCheckIn && (
                            <div>
                                <p className="text-xs text-muted">Check-in</p>
                                <p className="font-medium text-heading">
                                    {booking.hotelCheckIn.toLocaleDateString("en-US", { dateStyle: "long" })}
                                </p>
                            </div>
                        )}
                        {booking.hotelCheckOut && (
                            <div>
                                <p className="text-xs text-muted">Check-out</p>
                                <p className="font-medium text-heading">
                                    {booking.hotelCheckOut.toLocaleDateString("en-US", { dateStyle: "long" })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Customer Info */}
            <div className="bg-surface/50 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-heading uppercase">Customer</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted">Name</p>
                        <p className="font-medium text-heading">{booking.contactName || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Email</p>
                        <p className="font-medium text-heading">{booking.contactEmail || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">WhatsApp</p>
                        <p className="font-medium text-heading">{booking.contactWhatsApp || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Telegram</p>
                        <p className="font-medium text-heading">{booking.contactTelegram || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Notification</p>
                        <p className="font-medium text-heading">{booking.preferredNotif}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">User</p>
                        <p className="font-medium text-heading">
                            {booking.user?.name || booking.user?.email || "Guest"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Info */}
            <div className="bg-surface/50 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-heading uppercase">Payment</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted">Amount USD</p>
                        <p className="font-medium text-heading">
                            ${booking.amountUSD?.toFixed(2) || "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Amount IDR</p>
                        <p className="font-medium text-heading">
                            {booking.amountIDR
                                ? `Rp ${new Intl.NumberFormat("en-US").format(booking.amountIDR)}`
                                : "—"}
                        </p>
                    </div>
                    {booking.order && (
                        <>
                            <div>
                                <p className="text-xs text-muted">Payment Method</p>
                                <p className="font-medium text-heading">
                                    {booking.order.paymentMethod || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Order Status</p>
                                <p className="font-medium text-heading">
                                    {booking.order.status}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Passengers + Copy to Clipboard */}
            <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-heading uppercase">
                    Passengers ({booking.passengerCount})
                </h3>
                <CopyPassengerData
                    passengers={booking.passengers.map((p) => ({
                        id: p.id,
                        fullName: p.fullName,
                        nationality: p.nationality,
                        salutation: p.salutation,
                        dateOfBirth: p.dateOfBirth?.toISOString() || null,
                        passportNo: p.passportNo,
                    }))}
                    bookingRoute={route}
                />
            </div>

            {/* Status Update Actions */}
            {(booking.status === "PAID" || booking.status === "DELIVERED") && (
                <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-heading uppercase">Actions</h3>
                    <StatusUpdateButton
                        bookingId={booking.id}
                        currentStatus={booking.status}
                    />
                </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted text-center space-y-1">
                <p>Created: {booking.createdAt.toLocaleString("en-US")}</p>
                <p>Updated: {booking.updatedAt.toLocaleString("en-US")}</p>
            </div>
        </main>
    );
}
