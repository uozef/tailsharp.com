"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";

export default function RiskDisclosure() {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem("risk-accepted") === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50/80 px-4 py-2 text-sm text-amber-800">
      <div className="mx-auto flex max-w-7xl items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="leading-snug">
              <strong>Risk Warning:</strong> Copy trading involves significant
              risk. Past performance does not guarantee future results. Only
              invest what you can afford to lose.
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              {expanded ? <>Less <ChevronUp className="h-3 w-3" /></> : <>More <ChevronDown className="h-3 w-3" /></>}
            </button>
          </div>
          {expanded && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-amber-700">
              <li>Slippage may occur between leader and follower execution, resulting in different prices.</li>
              <li>Execution delays can affect outcomes, especially during high volatility.</li>
              <li>TailSharp does not provide financial, investment, or legal advice.</li>
              <li>Historical metrics are based on past data and may not indicate future results.</li>
              <li>You are solely responsible for your own investment decisions.</li>
            </ul>
          )}
        </div>
        <button
          onClick={() => { localStorage.setItem("risk-accepted", "true"); setDismissed(true); }}
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          I Understand
        </button>
        <button
          onClick={() => { localStorage.setItem("risk-accepted", "true"); setDismissed(true); }}
          className="shrink-0 text-amber-500 hover:text-amber-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
