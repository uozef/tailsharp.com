import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Shield,
  Brain,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowRight,
  CheckCircle,
  Zap,
  Eye,
  AlertTriangle,
  Code,
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
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/dashboard" className="text-sm font-medium text-muted transition-colors hover:text-blue-400">
            Platform
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-muted transition-colors hover:text-blue-400">
            Pricing
          </Link>
          <Link href="/risk" className="text-sm font-medium text-muted transition-colors hover:text-blue-400">
            Research
          </Link>
          <Link href="/account" className="text-sm font-medium text-muted transition-colors hover:text-blue-400">
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Get Access
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-background to-blue-50">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-8 py-24 text-center lg:py-36">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-surface-inset px-4 py-1.5 text-sm font-medium text-blue-400">
            <CheckCircle className="h-4 w-4 text-gold-400" />
            Trusted by hedge funds, research teams, and professional traders
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Prediction Market
            <br />
            <span className="text-blue-400">Intelligence, Decoded</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            The first platform to separate skill from luck in prediction markets.
            Powered by the Sharpness Rating — a statistical methodology that
            identifies persistent forecasting edge from on-chain activity.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              Get Access
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/risk"
              className="flex items-center gap-2 rounded-2xl border border-card-border bg-surface px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-blue-300 hover:bg-surface-inset"
            >
              View Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do — 3 Pillars */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              What We Do
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              Three pillars of prediction market data intelligence.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Identify Skill
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Closing-line value analysis, behavioral profiling, and
                hierarchical Bayesian ratings that separate genuine forecasting
                edge from noise.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Quantify Risk
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Oracle risk, collateral health, liquidity depth, and market
                integrity scoring across every prediction market.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Deliver Alpha
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Real-time position intelligence, sharp flow signals, and the
                Sharp Index — a skill-weighted consensus that diverges from raw
                market prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Institutions */}
      <section className="border-y border-card-border bg-surface-inset py-20">
        <div className="mx-auto max-w-5xl px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              For Institutions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              Enterprise-grade data products for professional market participants.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Sharp Flow Alerts
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Know when verified skill is positioning. Real-time notifications
                when high-rated wallets enter or exit markets.
              </p>
            </div>

            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Fade Signals
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Aggregate recreational flow for contrarian strategies. Identify
                when uninformed money is moving prices.
              </p>
            </div>

            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Market Integrity Data
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Wash volume detection, sybil cluster identification, and
                manipulation scoring for every market.
              </p>
            </div>

            <div className="rounded-2xl border border-card-border bg-surface p-8 transition-colors hover:border-blue-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Custom API Access
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Full feature dictionary, entity resolution, and rated wallet
                feeds via a robust REST API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-card-border bg-surface py-12">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-12 px-8 text-center">
          {[
            { value: "500+", label: "Wallets Rated" },
            { value: "15", label: "Feature Signals" },
            { value: "$2B+", label: "Volume Analyzed" },
            { value: "Daily", label: "Risk Index" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-center text-[11px] text-muted">
          Figures based on Polymarket on-chain data analysis.
        </p>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Plans Built for Every Stage
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted">
            From individual researchers to institutional desks. Start with a free
            trial, scale as you grow.
          </p>
          <div className="mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              View Pricing
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 py-16">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Start Discovering True Market Leaders
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-blue-100">
            Join the leading prediction market intelligence platform. Separate
            skill from luck, quantify risk, and find alpha.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl bg-surface px-8 py-4 text-base font-semibold text-blue-600 transition-all hover:bg-surface-inset"
            >
              Get Access
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-2xl border border-blue-300 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-blue-500"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Image src="/tailsharp-icon.svg" alt="TailSharp" width={20} height={20} />
            <span className="font-semibold text-white">TailSharp</span>
            <span className="text-blue-400">&mdash;</span>
            <span>Prediction Market Data Intelligence</span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="#terms" className="hover:text-white">Terms of Service</Link>
            <Link href="#privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="#risk" className="hover:text-white">Risk Disclosure</Link>
            <Link href="#faq" className="hover:text-white">FAQ</Link>
          </nav>
          <p className="text-xs text-slate-500">Data may be delayed. Not financial advice.</p>
        </div>
        <div className="border-t border-slate-800 px-8 py-3 text-center text-[11px] text-slate-500">
          &copy; 2025 TailSharp. All rights reserved. Trading prediction markets involves risk of loss.
        </div>
      </footer>
    </div>
  );
}
