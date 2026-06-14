import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Shield,
  Copy,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-card-border bg-surface/90 px-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image src="/tailsharp-icon.svg" alt="TailSharp" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-blue-400">TAIL</span><span className="text-gold-400">SHARP</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/discover"
            className="text-sm font-medium text-muted transition-colors hover:text-blue-400"
          >
            Explore Leaders
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-background to-green-50">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-green-200 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-8 py-24 text-center lg:py-36">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-surface-inset px-4 py-1.5 text-sm font-medium text-blue-400">
            <CheckCircle className="h-4 w-4 text-gold-400" />
            Trusted by 2,500+ traders
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Copy the Best.
            <br />
            <span className="text-gold-400">Earn Like the Best.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Automatically copy top Polymarket traders with smart risk
            management. Use Kelly Criterion sizing, diversification tools, and
            real-time analytics to grow your prediction market portfolio.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/discover"
              className="flex items-center gap-2 rounded-2xl border border-card-border bg-surface px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-blue-300 hover:bg-surface-inset"
            >
              Explore Leaders
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted">
            Copy trading involves risk of loss. Past performance does not guarantee future results. Not financial advice.
          </p>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-card-border bg-surface py-12">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-12 px-8 text-center">
          {[
            { value: "2,500+", label: "Active Traders" },
            { value: "$4.2M+", label: "Copy Volume" },
            { value: "12", label: "Top Leaders" },
            { value: "68%", label: "Avg Win Rate" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-center text-[11px] text-muted">
          Past performance does not guarantee future results. Figures shown are based on historical data.
        </p>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Everything You Need to Copy Trade Smarter
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              Professional-grade tools designed for safety, transparency, and
              consistent returns.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Copy className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Copy Top Traders
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Browse verified prediction market leaders, review their full
                track record, and automatically mirror their trades in real time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Smart Risk Management
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Set maximum drawdown limits, position sizes, and stop-loss
                thresholds. Our platform protects your capital while you earn.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Kelly Criterion Sizing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Mathematically optimal position sizing based on each
                leader&apos;s win rate and reward-to-risk ratio. Grow capital
                efficiently.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Diversified Portfolios
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Follow multiple uncorrelated leaders across categories.
                Correlation heatmaps help you build a balanced, resilient
                portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 py-16">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Start Copy Trading?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-green-100">
            Join thousands of traders who are already earning from the best
            Polymarket leaders. Start with as little as $100.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl bg-surface px-8 py-4 text-base font-semibold text-blue-400 transition-all hover:bg-surface-inset"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/discover"
              className="flex items-center gap-2 rounded-2xl border border-blue-400 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-green-500"
            >
              Browse Leaders
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-900 bg-green-950 text-green-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Image src="/tailsharp-icon.svg" alt="TailSharp" width={20} height={20} />
            <span className="font-semibold text-white">TailSharp</span>
            <span className="text-green-400">&mdash;</span>
            <span>Prediction Market Copy Trading</span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="#terms" className="hover:text-white">Terms of Service</Link>
            <Link href="#privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="#risk" className="hover:text-white">Risk Disclosure</Link>
            <Link href="#faq" className="hover:text-white">FAQ</Link>
          </nav>
          <p className="text-xs text-green-400">Data may be delayed. Not financial advice.</p>
        </div>
        <div className="border-t border-green-900 px-8 py-3 text-center text-[11px] text-green-500">
          &copy; 2025 TailSharp. All rights reserved. Trading prediction markets involves risk of loss.
        </div>
      </footer>
    </div>
  );
}
