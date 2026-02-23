/**
 * Shared constants and logic for Booking and Order status management.
 */

export const BOOKING_STATUS = {
    DRAFT: "DRAFT",
    PENDING_PAYMENT: "PENDING_PAYMENT",
    PAID: "PAID",
    PROCESSING: "PROCESSING",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS;

export const ORDER_STATUS = {
    PENDING: "PENDING",
    PAID: "PAID",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    FAILED: "FAILED",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

/**
 * Valid transitions for Booking status in the Admin Panel
 */
export const ADMIN_STATUS_TRANSITIONS: Record<string, string[]> = {
    [BOOKING_STATUS.PAID]: [BOOKING_STATUS.DELIVERED],
    [BOOKING_STATUS.DELIVERED]: [BOOKING_STATUS.COMPLETED],
};

/**
 * Maps Booking status to the corresponding Order status update
 */
export const BOOKING_TO_ORDER_STATUS_MAP: Record<string, string> = {
    [BOOKING_STATUS.PAID]: ORDER_STATUS.PAID,
    [BOOKING_STATUS.DELIVERED]: ORDER_STATUS.PAID, // Still paid, but delivered
    [BOOKING_STATUS.COMPLETED]: ORDER_STATUS.COMPLETED,
    [BOOKING_STATUS.CANCELLED]: ORDER_STATUS.CANCELLED,
};

export const STATUS_UI_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    [BOOKING_STATUS.DRAFT]: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: "📝" },
    [BOOKING_STATUS.PENDING_PAYMENT]: { label: "Awaiting Payment", color: "bg-yellow-50 text-yellow-700", icon: "⏳" },
    [BOOKING_STATUS.PAID]: { label: "Paid", color: "bg-blue-50 text-blue-700", icon: "💳" },
    [BOOKING_STATUS.PROCESSING]: { label: "Processing", color: "bg-indigo-50 text-indigo-700", icon: "⚙️" },
    [BOOKING_STATUS.DELIVERED]: { label: "Delivered", color: "bg-emerald-50 text-emerald-700", icon: "📨" },
    [BOOKING_STATUS.COMPLETED]: { label: "Completed", color: "bg-green-50 text-green-700", icon: "✅" },
    [BOOKING_STATUS.CANCELLED]: { label: "Cancelled", color: "bg-red-50 text-red-700", icon: "❌" },
};
