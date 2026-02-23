import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
    title: "Orders — Admin Panel",
    description: "Manage all bookings and orders.",
};

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING_PAYMENT: "bg-yellow-50 text-yellow-700",
    PAID: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-indigo-50 text-indigo-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_PAYMENT: "Pending",
    PAID: "Paid",
    PROCESSING: "Processing",
    DELIVERED: "Delivered",
    COMPLETED: "Done",
    CANCELLED: "Cancelled",
};

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || "1"));
    const status = params.status;
    const search = params.search;
    const limit = 20;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { contactName: { contains: search, mode: "insensitive" } },
            { contactEmail: { contains: search, mode: "insensitive" } },
            { departureCity: { contains: search, mode: "insensitive" } },
            { arrivalCity: { contains: search, mode: "insensitive" } },
        ];
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                passengers: true,
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const allStatuses = ["DRAFT", "PENDING_PAYMENT", "PAID", "PROCESSING", "DELIVERED", "COMPLETED", "CANCELLED"];

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-heading font-heading">
                        📦 All Orders
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        {total} booking{total !== 1 ? "s" : ""} total
                    </p>
                </div>

                {/* Search */}
                <form className="flex gap-2" method="GET">
                    {status && <input type="hidden" name="status" value={status} />}
                    <input
                        name="search"
                        type="text"
                        placeholder="Search name, email, city..."
                        defaultValue={search || ""}
                        className="px-3 py-2 text-sm border border-gold-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-64"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors cursor-pointer"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Link
                    href="/admin/orders"
                    className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${!status
                        ? "bg-primary text-white"
                        : "bg-surface text-muted hover:bg-primary/10"
                        }`}
                >
                    All
                </Link>
                {allStatuses.map((s) => (
                    <Link
                        key={s}
                        href={`/admin/orders?status=${s}${search ? `&search=${search}` : ""}`}
                        className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${status === s
                            ? "bg-primary text-white"
                            : "bg-surface text-muted hover:bg-primary/10"
                            }`}
                    >
                        {STATUS_LABELS[s]}
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div className="bg-surface border border-gold-border/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface border-b border-gold-border/50">
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    ID
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Route
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Type
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Customer
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Pax
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Amount
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Status
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-border/30">
                            {bookings.map((b) => (
                                <tr
                                    key={b.id}
                                    className="hover:bg-surface/80 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/orders/${b.id}`}
                                            className="text-primary font-mono text-xs hover:underline"
                                        >
                                            {b.id.slice(0, 8)}…
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-heading font-medium">
                                        {b.departureCity.split(" (")[0]} →{" "}
                                        {b.arrivalCity.split(" (")[0]}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${b.productType === "DUMMY_BUNDLE"
                                            ? "bg-purple-50 text-purple-700"
                                            : "bg-sky-50 text-sky-700"
                                            }`}>
                                            {b.productType === "DUMMY_BUNDLE" ? "Bundle" : "Flight"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-heading">
                                            {b.contactName || b.user?.name || "—"}
                                        </div>
                                        <div className="text-xs text-muted">
                                            {b.contactEmail || b.user?.email || "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-heading">
                                        {b.passengerCount}
                                    </td>
                                    <td className="px-4 py-3">
                                        {b.amountIDR ? (
                                            <span className="text-heading font-medium">
                                                Rp {new Intl.NumberFormat("en-US").format(b.amountIDR)}
                                            </span>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {STATUS_LABELS[b.status] || b.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                                        {new Date(b.createdAt).toLocaleDateString("en-US", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-muted"
                                    >
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    {page > 1 && (
                        <Link
                            href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                            className="px-3 py-1.5 text-sm bg-surface border border-gold-border rounded-lg hover:bg-primary/5 transition-colors"
                        >
                            ← Prev
                        </Link>
                    )}
                    <span className="text-sm text-muted">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link
                            href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                            className="px-3 py-1.5 text-sm bg-surface border border-gold-border rounded-lg hover:bg-primary/5 transition-colors"
                        >
                            Next →
                        </Link>
                    )}
                </div>
            )}
        </main>
    );
}
