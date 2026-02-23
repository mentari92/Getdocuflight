import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
    title: "Admin Dashboard — GetDocuFlight",
    description: "Revenue overview and booking statistics.",
};

export default async function AdminDashboardPage() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // KPIs
    const [revenueToday, revenueWeek, revenueMonth, totalBookings, activeBookings, paidBookings, totalPredictions] =
        await Promise.all([
            prisma.order.aggregate({
                _sum: { amountIDR: true },
                where: { status: "PAID", paidAt: { gte: todayStart } },
            }),
            prisma.order.aggregate({
                _sum: { amountIDR: true },
                where: { status: "PAID", paidAt: { gte: weekStart } },
            }),
            prisma.order.aggregate({
                _sum: { amountIDR: true },
                where: { status: "PAID", paidAt: { gte: monthStart } },
            }),
            prisma.booking.count(),
            prisma.booking.count({
                where: { status: { in: ["DRAFT", "PENDING_PAYMENT", "PAID", "PROCESSING"] } },
            }),
            prisma.booking.count({ where: { status: "PAID" } }),
            prisma.prediction.count(),
        ]);

    const conversionRate = totalBookings > 0 ? Math.round((paidBookings / totalBookings) * 100) : 0;
    const formatIDR = (n: number) => new Intl.NumberFormat("en-US").format(n);

    // Daily revenue (last 7 days)
    const dailyRevenue: { date: string; label: string; amountIDR: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(todayStart);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const agg = await prisma.order.aggregate({
            _sum: { amountIDR: true },
            _count: true,
            where: { status: "PAID", paidAt: { gte: dayStart, lt: dayEnd } },
        });

        dailyRevenue.push({
            date: dayStart.toISOString().split("T")[0],
            label: dayStart.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
            amountIDR: agg._sum.amountIDR || 0,
            count: agg._count || 0,
        });
    }

    // Recent bookings (last 5)
    const recentBookings = await prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
    });

    // Recent predictions (last 5)
    const recentPredictions = await prisma.prediction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
    });

    const kpiCards = [
        { label: "Today's Revenue", value: `Rp ${formatIDR(revenueToday._sum.amountIDR || 0)}`, icon: "💰", color: "from-green-500/10 to-green-500/5" },
        { label: "7-Day Revenue", value: `Rp ${formatIDR(revenueWeek._sum.amountIDR || 0)}`, icon: "📈", color: "from-blue-500/10 to-blue-500/5" },
        { label: "Monthly Revenue", value: `Rp ${formatIDR(revenueMonth._sum.amountIDR || 0)}`, icon: "📊", color: "from-purple-500/10 to-purple-500/5" },
        { label: "Conversion Rate", value: `${conversionRate}%`, icon: "🎯", color: "from-orange-500/10 to-orange-500/5" },
    ];

    const statCards = [
        { label: "Total Bookings", value: totalBookings, icon: "📦" },
        { label: "Active", value: activeBookings, icon: "🔄" },
        { label: "Predictions", value: totalPredictions, icon: "🔮" },
    ];

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-heading font-heading">
                    📊 Dashboard
                </h1>
                <p className="text-sm text-muted mt-1">
                    Revenue overview & booking statistics.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpiCards.map((card) => (
                    <div
                        key={card.label}
                        className={`bg-gradient-to-br ${card.color} border border-gold-border/30 rounded-2xl p-5`}
                    >
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <p className="text-xs text-muted uppercase font-medium">{card.label}</p>
                        <p className="text-xl font-extrabold text-heading font-heading mt-1">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Stat mini cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-surface border border-gold-border/30 rounded-2xl p-4 text-center"
                    >
                        <span className="text-xl">{card.icon}</span>
                        <p className="text-2xl font-extrabold text-heading font-heading mt-1">
                            {card.value}
                        </p>
                        <p className="text-xs text-muted">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Daily Revenue Table */}
            <div className="bg-surface border border-gold-border/50 rounded-2xl overflow-hidden mb-8">
                <div className="px-5 py-4 border-b border-gold-border/30">
                    <h2 className="text-sm font-bold text-heading uppercase">
                        📅 Daily Revenue (Last 7 Days)
                    </h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface/80">
                            <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Date</th>
                            <th className="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Transactions</th>
                            <th className="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-border/20">
                        {dailyRevenue.map((day) => (
                            <tr key={day.date} className="hover:bg-surface/60 transition-colors">
                                <td className="px-5 py-3 text-heading font-medium">{day.label}</td>
                                <td className="px-5 py-3 text-right text-heading">{day.count}</td>
                                <td className="px-5 py-3 text-right font-bold text-heading">
                                    Rp {formatIDR(day.amountIDR)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Bookings */}
            <div className="bg-surface border border-gold-border/50 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gold-border/30 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-heading uppercase">📦 Recent Bookings</h2>
                    <Link
                        href="/admin/orders"
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        View All →
                    </Link>
                </div>
                <div className="divide-y divide-gold-border/20">
                    {recentBookings.map((b) => (
                        <Link
                            key={b.id}
                            href={`/admin/orders/${b.id}`}
                            className="flex items-center justify-between px-5 py-3 hover:bg-surface/60 transition-colors"
                        >
                            <div>
                                <p className="text-sm font-medium text-heading">
                                    {b.departureCity.split(" (")[0]} → {b.arrivalCity.split(" (")[0]}
                                </p>
                                <p className="text-xs text-muted">
                                    {b.contactName || b.user?.name || "—"} · {b.passengerCount} pax
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${b.status === "PAID" ? "bg-blue-50 text-blue-700" :
                                    b.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                                        b.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                                            "bg-gray-100 text-gray-700"
                                    }`}>
                                    {b.status}
                                </span>
                                <p className="text-xs text-muted mt-0.5">
                                    {b.createdAt.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                                </p>
                            </div>
                        </Link>
                    ))}
                    {recentBookings.length === 0 && (
                        <div className="px-5 py-8 text-center text-muted text-sm">
                            No bookings yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Predictions */}
            <div className="bg-surface border border-gold-border/50 rounded-2xl overflow-hidden mt-8">
                <div className="px-5 py-4 border-b border-gold-border/30">
                    <h2 className="text-sm font-bold text-heading uppercase">🔮 Recent Predictions</h2>
                </div>
                <div className="divide-y divide-gold-border/20">
                    {recentPredictions.map((p) => (
                        <Link
                            key={p.id}
                            href={`/dashboard/predictions/${p.id}`}
                            className="flex items-center justify-between px-5 py-3 hover:bg-surface/60 transition-colors"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-heading truncate">
                                    {p.fromCountry} → {p.toCountry}
                                </p>
                                <p className="text-xs text-muted truncate">
                                    {p.user?.name || p.user?.email || "Guest"}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.riskLevel === "LOW" ? "bg-purple-50 text-purple-700" :
                                    p.riskLevel === "MEDIUM" ? "bg-amber-50 text-amber-700" :
                                        "bg-red-50 text-red-700"
                                    }`}>
                                    {p.riskLevel} Risk
                                </span>
                                <p className="text-xs text-muted mt-0.5">
                                    {p.createdAt.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                                </p>
                            </div>
                        </Link>
                    ))}
                    {recentPredictions.length === 0 && (
                        <div className="px-5 py-8 text-center text-muted text-sm">
                            No predictions yet.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
