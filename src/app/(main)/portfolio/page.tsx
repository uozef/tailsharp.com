"use client";
import { Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-inset">
        <Briefcase className="h-8 w-8 text-blue-400" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-foreground">Connect Your Wallet</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Connect your Polymarket wallet to track your copy-trading portfolio,
        manage allocations, and monitor performance in real time.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/account" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Connect Wallet <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/discover" className="rounded-xl border border-card-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-inset">
          Explore Leaders
        </Link>
      </div>
    </div>
  );
}
