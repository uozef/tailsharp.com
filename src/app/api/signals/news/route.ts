import { type NextRequest } from "next/server";
import { getNewsItems } from "@/lib/news-monitor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const items = await getNewsItems(isNaN(limit) ? 50 : limit);
    return Response.json({ news: items });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
