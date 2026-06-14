import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-card-border bg-surface text-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Image src="/tailsharp-icon.svg" alt="TailSharp" width={20} height={20} />
          <span className="font-semibold text-foreground">TailSharp</span>
          <span className="text-blue-400">&mdash;</span>
          <span>Prediction Market Copy Trading</span>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-xs">
          <Link href="#terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="#privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="#risk" className="hover:text-foreground">Risk Disclosure</Link>
          <Link href="#faq" className="hover:text-foreground">FAQ</Link>
        </nav>

        <p className="text-xs text-muted">Data may be delayed. Not financial advice.</p>
      </div>

      <div className="border-t border-card-border px-6 py-3 text-center text-[11px] text-muted">
        &copy; 2025 TailSharp. All rights reserved. Trading prediction markets involves risk of loss.
      </div>
    </footer>
  );
}
