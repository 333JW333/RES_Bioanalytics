import { NextResponse } from "next/server";
import { getStaffUser } from "@/lib/staff";

/**
 * Whether the signed-in visitor is staff (STAFF_EMAILS), so the header can
 * show its Staff tools link. Keeps the staff list on the server; the staff
 * pages check again themselves.
 */
export async function GET() {
  const staff = (await getStaffUser()) !== null;
  return NextResponse.json({ staff }, { headers: { "Cache-Control": "private, no-store" } });
}
