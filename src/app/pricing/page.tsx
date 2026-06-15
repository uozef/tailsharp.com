"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const tiers = [
  {
    name: "Individual",
    monthlyPrice: 199,
    description: "For independent researchers and traders getting started with prediction market intelligence.",
    features: [
      "Access to Sharpness Ratings",
      "Leader profiles & behavioral analysis",
      "Risk Monitor dashboard",
      "Wallet lookup (50/month)",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaHref: "/dashboard",
    highlight: false,
  },
  {
    name: "Professional",
    monthlyPrice: 1999,
    description: "For professional traders and research teams who need real-time data and API access.",
    features: [
      "Everything in Individual",
      "Unlimited wallet lookups",
      "Full feature dictionary access",
      "Sharp flow alerts (real-time)",
      "API access (10K calls/month)",
      "Priority support",
    ],
    cta: "Get Access",
    ctaHref: "/dashboard",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Institutional",
    monthlyPrice: 9999,
    description: "For hedge funds and institutional desks requiring full data infrastructure and custom integrations.",
    features: [
      "Everything in Professional",
      "Unlimited API access",
      "Custom entity resolution",
      "Fade signal feed",
      "Market integrity raw data",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    ctaHref: "/account",
    highlight: false,
  },
];

const faqs = [
  {
    question: "What is the Sharpness Rating?",
    answer:
      "The Sharpness Rating is our proprietary statistical methodology that measures persistent forecasting skill in prediction markets. It uses closing-line value analysis, behavioral profiling, and hierarchical Bayesian models to separate genuine edge from luck.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "The Individual plan includes a 14-day free trial with full access to all Individual tier features. No credit card required to start. You can upgrade or cancel at any time.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time. When upgrading, you will be charged the prorated difference. When downgrading, the credit will be applied to future invoices.",
  },
  {
    question: "What data sources does TailSharp cover?",
    answer:
      "TailSharp currently covers on-chain activity from Polymarket, with expansion to additional prediction market venues planned. Our data pipeline processes all on-chain transactions, order book activity, and settlement events.",
  },
  {
    question: "Do you offer custom enterprise agreements?",
    answer:
      "Yes. For institutional clients with specific requirements around data delivery, SLAs, custom integrations, or volume-based pricing, please contact our sales team to discuss a tailored agreement.",
  },
  {
    question: "What format is the API data delivered in?",
    answer:
      "Our REST API delivers data in JSON format with comprehensive documentation. We support both real-time streaming (WebSocket) and polling endpoints. SDKs are available for Python and TypeScript.",
  },
];

function formatPrice(price: number): string {
  return price.toLocaleString("en-US");
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-card-border bg-surface/90 px-8 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/tailsharp-icon.svg" alt="TailSharp" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-blue-400">TAIL</span><span className="text-gold-400">SHARP</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/dashboard" className="text-sm font-medium text-muted transition-colors hover:text-blue-400">
            Platform
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-blue-400">
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

      {/* Header */}
      <section className="bg-gradient-to-b from-slate-50 to-background py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Choose the plan that fits your workflow. All plans include a 14-day
          free trial.
        </p>

        {/* Annual Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                annual ? "translate-x-5.5 left-0.5" : "left-0.5 translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted"}`}>
            Annual
          </span>
          {annual && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Save 20%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto -mt-4 w-full max-w-6xl px-8 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const price = annual
              ? Math.round(tier.monthlyPrice * 12 * 0.8 / 12)
              : tier.monthlyPrice;

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition-colors ${
                  tier.highlight
                    ? "border-blue-500 bg-[#0f172a] text-slate-200 shadow-lg shadow-blue-500/10"
                    : "border-card-border bg-[#0f172a] text-slate-200"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                    {tier.badge}
                  </div>
                )}

                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{tier.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-white">
                    ${formatPrice(price)}
                  </span>
                  <span className="text-sm text-slate-400">/month</span>
                  {annual && (
                    <p className="mt-1 text-xs text-slate-500">
                      Billed annually at ${formatPrice(price * 12)}/year
                    </p>
                  )}
                </div>

                <ul className="mt-8 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaHref}
                  className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-card-border bg-surface-inset py-20">
        <div className="mx-auto max-w-3xl px-8">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 divide-y divide-card-border">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-base font-medium text-foreground">
                    {faq.question}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted" />
                  )}
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
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
