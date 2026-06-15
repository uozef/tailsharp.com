"use client";

import { useState } from "react";

const pages = [
  { id: 1, label: "Minimal Intelligence", src: "/home1.html" },
  { id: 2, label: "Billion-Scale Terminal", src: "/home2.html" },
  { id: 3, label: "Gold Standard", src: "/home3.html" },
  { id: 4, label: "Institutional Flow", src: "/home4.html" },
  { id: 5, label: "Latest Design", src: "/home5.html" },
];

export default function LandingPage() {
  const [active, setActive] = useState(2);
  const [showPicker, setShowPicker] = useState(false);

  const currentPage = pages.find((p) => p.id === active) ?? pages[1];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* The landing page iframe */}
      <iframe
        src={currentPage.src}
        className="h-full w-full border-0"
        title={currentPage.label}
      />

      {/* Floating page picker (bottom-right) */}
      <div className="fixed bottom-4 right-4 z-50">
        {showPicker && (
          <div className="mb-2 rounded-xl bg-[#0f172a] border border-[#334155] shadow-2xl p-3 space-y-1.5 min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">Select Homepage</p>
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => { setActive(p.id); setShowPicker(false); }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === p.id
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-300 hover:bg-[#1e293b]"
                }`}
              >
                Home {p.id}: {p.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 rounded-full bg-[#0f172a] border border-[#334155] px-4 py-2.5 text-xs font-medium text-slate-300 shadow-lg hover:bg-[#1e293b] transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Home {active}
        </button>
      </div>
    </div>
  );
}
