"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine, ReferenceDot,
  ResponsiveContainer, CartesianGrid, Tooltip,
} from "recharts";

/* ============================================================
   TailSharp — Edge-Driven Ticket Pricing Model
   Principle: you sell position on the edge-decay curve.
   Subscription sets the LATENCY FLOOR (how fresh you may pull).
   TICKETS meter volume. Freshness is a ticket multiplier.
   ============================================================ */

// ---- Edge decay: V(t) = e^(-ln2/h * t), half-life h minutes ----
const HALF_LIFE = 30; // minutes — sharp-flow edge half-life
const lambda = Math.LN2 / HALF_LIFE;
const edgeAt = (mins: number) => Math.exp(-lambda * mins);

// ---- Freshness bands (the ticket multiplier) ----
const FRESHNESS: Record<string, { key: string; label: string; mins: number; tickets: number; tierRank: number }> = {
  realtime: { key: "realtime", label: "Real-time", mins: 1, tickets: 5, tierRank: 3 },
  fast:     { key: "fast",     label: "15-min",    mins: 15, tickets: 2, tierRank: 2 },
  delayed:  { key: "delayed",  label: "60-min",    mins: 60, tickets: 1, tierRank: 1 },
};

// ---- Subscription tiers (the latency floor + ticket economy) ----
const TIERS = [
  {
    id: "scout", name: "Scout", rank: 1, price: 99,
    floor: "delayed", floorLabel: "60-min delayed",
    tickets: 150, overage: 1.20,
    blurb: "Get the signal, learn the read.",
    perks: ["Sharpness Ratings", "Daily sharp-flow digest", "Wallet lookups (ticketed)", "Email support"],
  },
  {
    id: "edge", name: "Edge", rank: 2, price: 499,
    floor: "fast", floorLabel: "15-min",
    tickets: 800, overage: 0.85,
    blurb: "Near-live flow for the active book.",
    perks: ["Everything in Scout", "15-min sharp-flow alerts", "Fade-signal pulls", "Feature dictionary", "Priority queue"],
    popular: true,
  },
  {
    id: "sharp", name: "Sharp", rank: 3, price: 1999,
    floor: "realtime", floorLabel: "Real-time",
    tickets: 4000, overage: 0.55,
    blurb: "Real-time edge, the moment it moves.",
    perks: ["Everything in Edge", "Real-time sharp-flow", "Live fade feed", "Entity resolution", "API (metered in tickets)"],
  },
  {
    id: "frontrun", name: "Frontrun", rank: 4, price: 9999,
    floor: "realtime", floorLabel: "Real-time + raw feed",
    tickets: 25000, overage: 0.30,
    blurb: "Lowest latency, raw feed, front of queue.",
    perks: ["Everything in Sharp", "Raw market-integrity feed", "Sub-second priority", "Custom integrations", "Redistribution clause + SLA"],
  },
];

const tierById = (id: string) => TIERS.find((t) => t.id === id);

// ---- palette (TailSharp navy / gold) ----
const C = {
  bg: "#0A1628", panel: "#0F2038", panel2: "#142A48", line: "#21456E",
  gold: "#D4AF37", goldBright: "#EBCB5E", goldDim: "#8C7836",
  text: "#E8EFF7", muted: "#90A6C2", faint: "#5B748F",
};
const MUTED = "#90A6C2";

export default function TailSharpPricing() {
  const [tierId, setTierId] = useState("edge");
  const [events, setEvents] = useState(1200);     // edge-events / month
  const [freshKey, setFreshKey] = useState("fast");

  const tier = tierById(tierId)!;

  // freshness allowed by the selected tier's floor
  const allowed = (fk: string) => FRESHNESS[fk].tierRank <= tier.rank;
  const fresh = allowed(freshKey) ? FRESHNESS[freshKey] : FRESHNESS[tier.floor];

  // ---- consumption math ----
  const ticketsUsed = events * fresh.tickets;
  const overTickets = Math.max(0, ticketsUsed - tier.tickets);
  const overageCost = overTickets * tier.overage;
  const total = tier.price + overageCost;
  const edgeCaptured = events * edgeAt(fresh.mins);     // "effective edge units"
  const costPerEdge = edgeCaptured > 0 ? total / edgeCaptured : 0;

  // ---- recommend cheapest tier that ALLOWS this freshness for this volume ----
  const recommendation = useMemo(() => {
    let best = null;
    for (const t of TIERS) {
      if (FRESHNESS[freshKey].tierRank > t.rank) continue; // tier can't reach this freshness
      const used = events * FRESHNESS[freshKey].tickets;
      const over = Math.max(0, used - t.tickets) * t.overage;
      const tot = t.price + over;
      if (!best || tot < best.total) best = { ...t, total: tot };
    }
    return best;
  }, [events, freshKey]);

  // ---- decay curve data ----
  const curve = useMemo(() => {
    const pts = [];
    for (let m = 0; m <= 120; m += 2) pts.push({ m, v: +(edgeAt(m) * 100).toFixed(1) });
    return pts;
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  const money = (n: number) => "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 22px", borderRadius: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        .tsmono { font-family: 'Space Grotesk', sans-serif; font-variant-numeric: tabular-nums; }
        .tschev::before { content: "›"; color: ${C.gold}; font-weight:700; margin-right:8px; }
        .tsbtn { transition: all .15s ease; cursor:pointer; }
        .tsbtn:hover { transform: translateY(-1px); }
        input[type=range].tsrange { -webkit-appearance:none; height:4px; border-radius:4px;
          background: linear-gradient(90deg, ${C.gold}, ${C.goldDim}); outline:none; }
        input[type=range].tsrange::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px;
          border-radius:50%; background:${C.goldBright}; border:2px solid ${C.bg}; cursor:pointer;
          box-shadow:0 0 0 4px rgba(212,175,55,.15); }
      `}</style>

      {/* ---------- HERO ---------- */}
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div className="tsmono" style={{ color: C.gold, letterSpacing: 3, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
          TailSharp · Edge Economy
        </div>
        <h1 className="tsmono" style={{ fontSize: 38, fontWeight: 700, margin: "8px 0 6px", lineHeight: 1.05 }}>
          You're not buying data.<br />You're buying <span style={{ color: C.gold }}>position on the decay curve.</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 15, maxWidth: 620, lineHeight: 1.55 }}>
          A sharp signal is worth most the instant the informed money moves, then decays as the market absorbs it.
          Your plan sets how <em style={{ color: C.text, fontStyle: "normal" }}>fresh</em> you may pull; tickets meter how <em style={{ color: C.text, fontStyle: "normal" }}>much</em>. Pay more, capture more of the edge before it's gone.
        </p>
      </div>

      {/* ---------- DECAY CURVE (signature) ---------- */}
      <div style={{ maxWidth: 920, margin: "26px auto 0", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 18px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
          <span className="tsmono" style={{ fontSize: 14, fontWeight: 600 }}>Edge captured vs. latency</span>
          <span style={{ fontSize: 12, color: C.muted }}>half-life ≈ {HALF_LIFE} min · V(t) = e<sup>−λt</sup></span>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={curve} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.gold} stopOpacity={0.55} />
                <stop offset="100%" stopColor={C.gold} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.line }}
              ticks={[0, 15, 30, 60, 90, 120]} tickFormatter={(m) => (m === 0 ? "now" : m + "m")} />
            <YAxis tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]}
              ticks={[0, 25, 50, 71, 100]} tickFormatter={(v) => v + "%"} />
            <Tooltip
              contentStyle={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, fontSize: 12 }}
              formatter={(v) => [v + "% edge", "captured"]} labelFormatter={(m) => `+${m} min`} />
            <Area type="monotone" dataKey="v" stroke={C.goldBright} strokeWidth={2} fill="url(#eg)" />
            {/* latency floor markers */}
            <ReferenceLine x={1} stroke={C.goldBright} strokeDasharray="3 3" />
            <ReferenceLine x={15} stroke={C.muted} strokeDasharray="3 3" />
            <ReferenceLine x={60} stroke={C.muted} strokeDasharray="3 3" />
            <ReferenceDot x={1} y={99} r={4} fill={C.goldBright} stroke="none" />
            <ReferenceDot x={15} y={71} r={4} fill={C.gold} stroke="none" />
            <ReferenceDot x={60} y={25} r={4} fill={C.goldDim} stroke="none" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 11.5, color: C.muted, paddingBottom: 8, flexWrap: "wrap", gap: 6 }}>
          <span><b style={{ color: C.goldBright }}>Real-time</b> → 100% edge · 5 tickets/event</span>
          <span><b style={{ color: C.gold }}>15-min</b> → 71% edge · 2 tickets/event</span>
          <span><b style={{ color: C.goldDim }}>60-min</b> → 25% edge · 1 ticket/event</span>
        </div>
      </div>

      {/* ---------- TIER CARDS ---------- */}
      <div style={{ maxWidth: 1040, margin: "30px auto 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {TIERS.map((t) => {
          const active = t.id === tierId;
          return (
            <div key={t.id} onClick={() => setTierId(t.id)} className="tsbtn"
              style={{
                background: active ? C.panel2 : C.panel,
                border: `1px solid ${active ? C.gold : C.line}`,
                borderRadius: 14, padding: "18px 16px", position: "relative",
                boxShadow: active ? `0 0 0 3px rgba(212,175,55,.12)` : "none",
              }}>
              {t.popular && (
                <span className="tsmono" style={{ position: "absolute", top: -10, right: 14, background: C.gold, color: C.bg, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: 1 }}>
                  MOST PICKED
                </span>
              )}
              <div className="tsmono" style={{ fontSize: 17, fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: C.muted, minHeight: 32, marginTop: 2 }}>{t.blurb}</div>
              <div style={{ margin: "10px 0 2px" }}>
                <span className="tsmono" style={{ fontSize: 28, fontWeight: 700 }}>{money(t.price)}</span>
                <span style={{ fontSize: 12, color: C.muted }}>/mo</span>
              </div>
              <div className="tsmono" style={{ fontSize: 11.5, color: C.gold, marginBottom: 10 }}>
                Floor: {t.floorLabel} · {fmt(t.tickets)} tickets
              </div>
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.perks.map((p, i) => (
                  <div key={i} className="tschev" style={{ fontSize: 12, color: C.text, lineHeight: 1.35 }}>{p}</div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
                Overage ${t.overage.toFixed(2)}/ticket
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- CALCULATOR ---------- */}
      <div style={{ maxWidth: 1040, margin: "26px auto 0", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 20px" }}>
        <div className="tsmono" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Model your spend — <span style={{ color: C.gold }}>{tier.name}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
          {/* inputs */}
          <div>
            <label style={{ fontSize: 12.5, color: C.muted }}>Edge-events / month</label>
            <div className="tsmono" style={{ fontSize: 24, fontWeight: 700, margin: "2px 0 8px" }}>{fmt(events)}</div>
            <input className="tsrange" type="range" min={50} max={100000} step={50} value={events}
              onChange={(e) => setEvents(+e.target.value)} style={{ width: "100%" }} />

            <div style={{ marginTop: 18, fontSize: 12.5, color: C.muted, marginBottom: 7 }}>Pull freshness</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.values(FRESHNESS).map((f) => {
                const ok = f.tierRank <= tier.rank;
                const on = fresh.key === f.key;
                return (
                  <button key={f.key} disabled={!ok} onClick={() => setFreshKey(f.key)} className="tsbtn"
                    style={{
                      flex: 1, padding: "9px 4px", borderRadius: 9, fontSize: 12.5,
                      fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
                      background: on ? C.gold : C.panel2,
                      color: on ? C.bg : ok ? C.text : C.faint,
                      border: `1px solid ${on ? C.gold : C.line}`,
                      opacity: ok ? 1 : 0.4, cursor: ok ? "pointer" : "not-allowed",
                    }}>
                    {f.label}
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>{f.tickets} tk</div>
                  </button>
                );
              })}
            </div>
            {!allowed(freshKey) && (
              <div style={{ fontSize: 11.5, color: C.gold, marginTop: 8 }}>
                {tier.name}'s floor is {tier.floorLabel} — upgrade to pull fresher.
              </div>
            )}
          </div>

          {/* outputs */}
          <div style={{ background: C.panel2, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.line}` }}>
            <Row label="Tickets used" value={`${fmt(ticketsUsed)} / ${fmt(tier.tickets)}`} />
            <Row label="Overage tickets" value={fmt(overTickets)} dim={overTickets === 0} />
            <Row label="Base subscription" value={money(tier.price)} />
            <Row label="Overage cost" value={money(overageCost)} dim={overageCost === 0} />
            <div style={{ borderTop: `1px solid ${C.line}`, margin: "10px 0" }} />
            <Row label="Monthly total" value={money(total)} big />
            <div style={{ borderTop: `1px solid ${C.line}`, margin: "10px 0" }} />
            <Row label="Edge captured (units)" value={fmt(edgeCaptured)} />
            <Row label="Cost / edge-unit" value={"$" + costPerEdge.toFixed(2)} accent />
          </div>
        </div>

        {/* recommendation */}
        {recommendation && recommendation.id !== tierId && (
          <div onClick={() => setTierId(recommendation.id)} className="tsbtn"
            style={{ marginTop: 16, background: "rgba(212,175,55,.08)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: C.text }}>
              For {fmt(events)} events at <b style={{ color: C.gold }}>{FRESHNESS[freshKey].label}</b>, <b style={{ color: C.gold }}>{recommendation.name}</b> is cheapest at <b className="tsmono">{money(recommendation.total)}</b>/mo.
            </span>
            <span className="tsmono" style={{ color: C.gold, fontWeight: 600 }}>Switch ›</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1040, margin: "14px auto 0", fontSize: 11, color: C.muted, textAlign: "center" }}>
        Illustrative economics. Half-life, ticket weights and overage rates are tunable inputs, not committed prices.
      </div>
    </div>
  );
}

function Row({ label, value, big, accent, dim }: { label: string; value: string; big?: boolean; accent?: boolean; dim?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0" }}>
      <span style={{ fontSize: 12.5, color: "#90A6C2" }}>{label}</span>
      <span className="tsmono"
        style={{ fontSize: big ? 22 : 14, fontWeight: big ? 700 : 600, color: dim ? "#5B748F" : accent ? "#D4AF37" : "#E8EFF7" }}>
        {value}
      </span>
    </div>
  );
}
