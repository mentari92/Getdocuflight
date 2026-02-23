/**
 * /dashboard/booking — Redirect to /order.
 *
 * The booking form has moved to the public /order page.
 */

import { redirect } from "next/navigation";

export default function BookingRedirect() {
    redirect("/order");
}
