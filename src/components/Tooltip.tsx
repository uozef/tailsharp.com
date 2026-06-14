"use client";

import { useState } from "react";

interface TooltipProps {
  term: string;
  explanation: string;
  children: React.ReactNode;
}

export default function Tooltip({ term, explanation, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="cursor-help border-b border-dotted border-current">
        {children}
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-normal rounded-lg bg-green-950 px-3 py-2 text-xs leading-relaxed text-white shadow-lg max-w-xs w-max pointer-events-none">
          <span className="block font-semibold mb-0.5">{term}</span>
          {explanation}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-green-950" />
        </span>
      )}
    </span>
  );
}
