/**
 * /order/[id] — Booking confirmation / payment page.
 *
 * Public page — no auth required.
 * Shows booking status, flight details, passengers, and payment CTA.
 */

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getIDRAmount } from "@/lib/currency";
import PayBookingButton from "@/components/booking/PayBookingButton";
import { PRICING } from "@/lib/booking-schema";
import type { ProductTypeKey } from "@/lib/booking-schema";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return {
        title: `Order ${id.slice(0, 8)}… — GetDocuFlight`,
        description: "Your dummy ticket order status.",
    };
}

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { passengers: true },
    });

    if (!booking) {
        notFound();
    }

    // Dynamic pricing based on product type
    const productType = booking.productType as ProductTypeKey;
    const priceUSD = booking.amountUSD ?? PRICING[productType] ?? 10;

    let priceIDR = Math.round(priceUSD * 16500);
    let exchangeRate = 16500;
    try {
        const idr = await getIDRAmount(priceUSD);
        priceIDR = idr.amountIDR;
        exchangeRate = idr.exchangeRate;
    } catch {
        // Fallback values
    }

    const formattedIDR = new Intl.NumberFormat("id-ID").format(priceIDR);
    const depDate = new Date(booking.departureDate).toLocaleDateString("en-US", {
        dateStyle: "long",
    });
    const retDate = booking.returnDate
        ? new Date(booking.returnDate).toLocaleDateString("en-US", {
            dateStyle: "long",
        })
        : null;

    const statusConfig: Record<
        string,
        { label: string; color: string; icon: string }
    > = {
        DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: "📝" },
        PENDING_PAYMENT: {
            label: "Awaiting Payment",
            color: "bg-yellow-50 text-yellow-700",
            icon: "⏳",
        },
        PAID: {
            label: "Paid — Processing",
            color: "bg-blue-50 text-blue-700",
            icon: "💳",
        },
        PROCESSING: {
            label: "Processing",
            color: "bg-blue-50 text-blue-700",
            icon: "⚙️",
        },
        DELIVERED: {
            label: "Delivered",
            color: "bg-green-50 text-green-700",
            icon: "📨",
        },
        COMPLETED: {
            label: "Completed",
            color: "bg-green-50 text-green-700",
            icon: "✅",
        },
        CANCELLED: {
            label: "Cancelled",
            color: "bg-red-50 text-red-700",
            icon: "❌",
        },
    };

    const status = statusConfig[booking.status] || statusConfig.DRAFT;
    const isBundle = booking.productType === "DUMMY_BUNDLE";

    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <Link
                            href="/order"
                            className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            New Order
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
                {/* Status Badge */}
                <div className={`${status.color} rounded-2xl p-5 text-center`}>
                    <span className="text-3xl block mb-2">{status.icon}</span>
                    <h2 className="text-lg font-bold font-heading">
                        {status.label}
                    </h2>
                    <p className="text-xs mt-1 opacity-80">
                        Order ID: {booking.id.slice(0, 8)}…
                    </p>
                </div>

                {/* Product Type */}
                <div className="bg-surface/50 rounded-2xl p-5 text-center">
                    <p className="text-sm font-bold text-heading">
                        {isBundle
                            ? "✈️🏨 Bundle: Flight + Hotel"
                            : "✈️ Dummy Flight Ticket"}
                    </p>
                    <p className="text-lg font-extrabold text-primary mt-1">
                        ${priceUSD} USD
                    </p>
                </div>

                {/* Flight Details */}
                <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-heading uppercase">
                        Flight Details
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <p className="text-lg font-bold text-heading">
                                {booking.departureCity.split(" (")[0]}
                            </p>
                            <p className="text-xs text-muted">
                                {booking.departureCity}
                            </p>
                        </div>
                        <div className="flex-1 flex items-center">
                            <div className="flex-1 h-px bg-gold-border" />
                            <span className="px-2 text-muted">✈️</span>
                            <div className="flex-1 h-px bg-gold-border" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-heading">
                                {booking.arrivalCity.split(" (")[0]}
                            </p>
                            <p className="text-xs text-muted">
                                {booking.arrivalCity}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-xs text-muted">Departure</p>
                            <p className="font-medium text-heading">{depDate}</p>
                        </div>
                        {retDate && (
                            <div>
                                <p className="text-xs text-muted">Return</p>
                                <p className="font-medium text-heading">
                                    {retDate}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-muted">Type</p>
                            <p className="font-medium text-heading">
                                {booking.tripType === "ROUND_TRIP"
                                    ? "Round Trip"
                                    : "One Way"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Passengers</p>
                            <p className="font-medium text-heading">
                                {booking.passengerCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hotel Details (bundle only) */}
                {isBundle && booking.hotelCity && (
                    <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-heading uppercase">
                            Hotel Details
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                                <p className="text-xs text-muted">City</p>
                                <p className="font-medium text-heading">
                                    {booking.hotelCity}
                                </p>
                            </div>
                            {booking.hotelCheckIn && (
                                <div>
                                    <p className="text-xs text-muted">Check-in</p>
                                    <p className="font-medium text-heading">
                                        {new Date(
                                            booking.hotelCheckIn
                                        ).toLocaleDateString("en-US")}
                                    </p>
                                </div>
                            )}
                            {booking.hotelCheckOut && (
                                <div>
                                    <p className="text-xs text-muted">Check-out</p>
                                    <p className="font-medium text-heading">
                                        {new Date(
                                            booking.hotelCheckOut
                                        ).toLocaleDateString("en-US")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Passengers */}
                <div className="bg-surface/50 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-heading uppercase">
                        Passengers
                    </h3>
                    {booking.passengers.map(
                        (
                            p: {
                                id: string;
                                fullName: string;
                                nationality: string;
                            },
                            i: number
                        ) => (
                            <div
                                key={p.id}
                                className="flex items-center gap-3 text-sm"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="font-medium text-heading">
                                        {p.fullName}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {p.nationality}
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Payment CTA for unpaid bookings */}
                {(booking.status === "DRAFT" ||
                    booking.status === "PENDING_PAYMENT") && (
                        <PayBookingButton
                            bookingId={booking.id}
                            formattedIDR={formattedIDR}
                            exchangeRate={exchangeRate}
                            preferredNotif={booking.preferredNotif}
                            amountUSD={priceUSD}
                        />
                    )}

                {/* Delivered message */}
                {(booking.status === "DELIVERED" ||
                    booking.status === "COMPLETED") && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                            <span className="text-2xl block mb-2">🎉</span>
                            <p className="text-sm font-semibold text-green-800">
                                Dummy ticket has been sent to{" "}
                                {booking.contactEmail}!
                            </p>
                        </div>
                    )}

                <p className="text-xs text-subtle text-center">
                    Dummy ticket is valid for visa applications. Not an actual
                    flight ticket.
                </p>
            </main>
        </div>
    );
}
