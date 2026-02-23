import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getIDRAmount } from "@/lib/currency";
import PayBookingButton from "@/components/booking/PayBookingButton";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return {
        title: `Booking ${id.slice(0, 8)}… — GetDocuFlight`,
        description: "Status booking dummy ticket kamu.",
    };
}

export default async function BookingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { passengers: true },
    });

    if (!booking || booking.userId !== session.user.id) {
        notFound();
    }

    // Get price for unpaid bookings
    let priceIDR = 49500;
    let exchangeRate = 16500;
    try {
        const idr = await getIDRAmount(3.0);
        priceIDR = idr.amountIDR;
        exchangeRate = idr.exchangeRate;
    } catch {
        // Fallback values
    }

    const formattedIDR = new Intl.NumberFormat("id-ID").format(priceIDR);
    const depDate = new Date(booking.departureDate).toLocaleDateString("id-ID", { dateStyle: "long" });
    const retDate = booking.returnDate
        ? new Date(booking.returnDate).toLocaleDateString("id-ID", { dateStyle: "long" })
        : null;

    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
        DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: "📝" },
        PENDING_PAYMENT: { label: "Menunggu Pembayaran", color: "bg-yellow-50 text-yellow-700", icon: "⏳" },
        PAID: { label: "Dibayar — Sedang Diproses", color: "bg-blue-50 text-blue-700", icon: "💳" },
        PROCESSING: { label: "Sedang Diproses", color: "bg-blue-50 text-blue-700", icon: "⚙️" },
        COMPLETED: { label: "Selesai", color: "bg-green-50 text-green-700", icon: "✅" },
        CANCELLED: { label: "Dibatalkan", color: "bg-red-50 text-red-700", icon: "❌" },
    };

    const status = statusConfig[booking.status] || statusConfig.DRAFT;

    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <Link
                            href="/dashboard"
                            className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/booking"
                            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                            + Booking Baru
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
                {/* Status Badge */}
                <div className={`${status.color} rounded-2xl p-5 text-center`}>
                    <span className="text-3xl block mb-2">{status.icon}</span>
                    <h2 className="text-lg font-bold font-heading">{status.label}</h2>
                    <p className="text-xs mt-1 opacity-80">
                        Booking ID: {booking.id.slice(0, 8)}…
                    </p>
                </div>

                {/* Flight Details */}
                <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-heading uppercase">Detail Penerbangan</h3>
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
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-xs text-muted">Berangkat</p>
                            <p className="font-medium text-heading">{depDate}</p>
                        </div>
                        {retDate && (
                            <div>
                                <p className="text-xs text-muted">Pulang</p>
                                <p className="font-medium text-heading">{retDate}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-muted">Tipe</p>
                            <p className="font-medium text-heading">
                                {booking.tripType === "ROUND_TRIP" ? "Pulang-Pergi" : "Sekali Jalan"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Penumpang</p>
                            <p className="font-medium text-heading">{booking.passengerCount}</p>
                        </div>
                    </div>
                </div>

                {/* Passengers */}
                <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-heading uppercase">Penumpang</h3>
                    {booking.passengers.map((p: { id: string; fullName: string; nationality: string }, i: number) => (
                        <div key={p.id} className="flex items-center gap-3 text-sm">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {i + 1}
                            </div>
                            <div>
                                <p className="font-medium text-heading">{p.fullName}</p>
                                <p className="text-xs text-muted">{p.nationality}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Payment CTA for unpaid bookings */}
                {(booking.status === "DRAFT" || booking.status === "PENDING_PAYMENT") && (
                    <PayBookingButton
                        bookingId={booking.id}
                        formattedIDR={formattedIDR}
                        exchangeRate={exchangeRate}
                        preferredNotif={booking.preferredNotif}
                    />
                )}

                {/* Completed message */}
                {booking.status === "COMPLETED" && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                        <span className="text-2xl block mb-2">🎉</span>
                        <p className="text-sm font-semibold text-green-800">
                            Dummy ticket sudah dikirim ke {booking.contactEmail}!
                        </p>
                    </div>
                )}

                <p className="text-xs text-subtle text-center">
                    Dummy ticket berlaku untuk keperluan pengajuan visa.
                    Bukan tiket penerbangan asli.
                </p>
            </main>
        </div>
    );
}
