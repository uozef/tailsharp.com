import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("q")?.trim();
    if (!input) return NextResponse.json({ error: "q parameter required" }, { status: 400 });

    // Already a wallet address
    if (/^0x[a-fA-F0-9]{40}$/i.test(input)) {
      return NextResponse.json({ wallet: input.toLowerCase() });
    }

    // Extract username from URL or raw input
    let username = input;
    // polymarket.com/@username
    const atMatch = input.match(/polymarket\.com\/@([a-zA-Z0-9_.-]+)/i);
    if (atMatch) username = atMatch[1];
    // polymarket.com/profile/username (non-wallet)
    const profileMatch = input.match(/polymarket\.com\/profile\/(?!0x)([a-zA-Z0-9_.-]+)/i);
    if (profileMatch) username = profileMatch[1];
    // Extract wallet from URL if present
    const walletInUrl = input.match(/(0x[a-fA-F0-9]{40})/i);
    if (walletInUrl) return NextResponse.json({ wallet: walletInUrl[1].toLowerCase() });

    // Resolve username by fetching the Polymarket profile page
    const profileUrl = `https://polymarket.com/@${encodeURIComponent(username)}`;
    const res = await fetch(profileUrl, {
      headers: { "User-Agent": "TailSharp/1.0" },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not find user @${username}` },
        { status: 404 }
      );
    }

    const html = await res.text();

    // Look for wallet address in the page content
    // Polymarket embeds proxyWallet in JSON data on the page
    const walletMatch = html.match(/proxyWallet["\s:]+["'](0x[a-fA-F0-9]{40})["']/i)
      || html.match(/wallet["\s:]+["'](0x[a-fA-F0-9]{40})["']/i)
      || html.match(/"address":\s*"(0x[a-fA-F0-9]{40})"/i)
      || html.match(/(0x[a-fA-F0-9]{40})/i);

    if (walletMatch) {
      return NextResponse.json({
        wallet: walletMatch[1].toLowerCase(),
        username,
        resolvedFrom: profileUrl,
      });
    }

    return NextResponse.json(
      { error: `Found profile but could not extract wallet for @${username}` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
