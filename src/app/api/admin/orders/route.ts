/**
 * GET /api/admin/orders
 *
 * Paginated, filterable order list for admin panel.
 * Admin auth required.
 *
 * Query params:
 *   page (default: 1)
 *   limit (default: 20, max: 100)
 *   status (BookingStatus filter)
 *   search (contact name, email, city)
 *   from, to (date range, YYYY-MM-DD)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    const { error } = await requireAdmin();
    if (error) {
        return NextResponse.json(
            { error: error.error },
            { status: error.status }
        );
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Build where clause
    const where: Prisma.BookingWhereInput = {};

    if (status) {
        where.status = status as Prisma.EnumBookingStatusFilter;
    }

    if (search) {
        where.OR = [
            { contactName: { contains: search, mode: "insensitive" } },
            { contactEmail: { contains: search, mode: "insensitive" } },
            { departureCity: { contains: search, mode: "insensitive" } },
            { arrivalCity: { contains: search, mode: "insensitive" } },
        ];
    }

    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
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

    return NextResponse.json({
        bookings: bookings.map((b) => ({
            id: b.id,
            status: b.status,
            departureCity: b.departureCity,
            arrivalCity: b.arrivalCity,
            departureDate: b.departureDate,
            returnDate: b.returnDate,
            tripType: b.tripType,
            passengerCount: b.passengerCount,
            contactName: b.contactName,
            contactEmail: b.contactEmail,
            amountUSD: b.amountUSD,
            amountIDR: b.amountIDR,
            source: b.source,
            createdAt: b.createdAt,
            user: b.user,
            passengers: b.passengers.map((p) => ({
                id: p.id,
                fullName: p.fullName,
                nationality: p.nationality,
                salutation: p.salutation,
                dateOfBirth: p.dateOfBirth,
                passportNo: p.passportNo,
            })),
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}
