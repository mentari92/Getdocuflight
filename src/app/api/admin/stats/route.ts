/**
 * GET /api/admin/stats
 *
 * Revenue dashboard stats for admin panel.
 * Returns KPI cards + daily revenue for last 7 days.
 * Admin auth required.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
    const { error } = await requireAdmin();
    if (error) {
        return NextResponse.json(
            { error: error.error },
            { status: error.status }
        );
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // KPI: Revenue today, this week, this month
    const [revenueToday, revenueWeek, revenueMonth, totalBookings, activeBookings, paidBookings] =
        await Promise.all([
            prisma.order.aggregate({
                _sum: { amountIDR: true },
                where: {
                    status: "PAID",
                    paidAt: { gte: todayStart },
                },
            }),
            prisma.order.aggregate({
                _sum: { amountIDR: true },
                where: {
                    status: "PAID",
                    paidAt: { gte: weekStart },
                },
            }),
            prisma.order.aggregate({
                _sum: { amountIDR: true },
                where: {
                    status: "PAID",
                    paidAt: { gte: monthStart },
                },
            }),
            prisma.booking.count(),
            prisma.booking.count({
                where: {
                    status: { in: ["DRAFT", "PENDING_PAYMENT", "PAID", "PROCESSING"] },
                },
            }),
            prisma.booking.count({
                where: { status: "PAID" },
            }),
        ]);

    // Daily revenue for last 7 days
    const dailyRevenue: { date: string; amountIDR: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(todayStart);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const agg = await prisma.order.aggregate({
            _sum: { amountIDR: true },
            _count: true,
            where: {
                status: "PAID",
                paidAt: { gte: dayStart, lt: dayEnd },
            },
        });

        dailyRevenue.push({
            date: dayStart.toISOString().split("T")[0],
            amountIDR: agg._sum.amountIDR || 0,
            count: agg._count || 0,
        });
    }

    return NextResponse.json({
        kpi: {
            revenueToday: revenueToday._sum.amountIDR || 0,
            revenueWeek: revenueWeek._sum.amountIDR || 0,
            revenueMonth: revenueMonth._sum.amountIDR || 0,
            totalBookings,
            activeBookings,
            paidBookings,
            conversionRate: totalBookings > 0
                ? Math.round((paidBookings / totalBookings) * 100)
                : 0,
        },
        dailyRevenue,
    });
}
