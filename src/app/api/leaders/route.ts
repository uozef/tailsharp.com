import { NextResponse } from "next/server";
import { getLeaders } from "@/lib/db-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const leaders = getLeaders(limit);
    return NextResponse.json(leaders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
