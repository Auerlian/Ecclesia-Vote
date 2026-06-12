"use client";

import { useEffect, useState } from "react";

const COLORS = ["#3D6BFF", "#FF5C39", "#FFB81F", "#12B97E", "#8B4DFF", "#F83D8E"];
const PIECES = 36;

/**
 * Lightweight CSS confetti burst (no dependencies). Mount it and it rains once, then
 * removes itself. Pieces are deterministic per index so SSR/CSR never disagree —
 * the whole component only renders after mount anyway.
 */
export function Confetti() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const id = setTimeout(() => setActive(false), 4200);
    return () => clearTimeout(id);
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {Array.from({ length: PIECES }, (_, i) => {
        const left = ((i * 37) % 100) + ((i * 13) % 7) / 10;
        const size = 7 + ((i * 11) % 8);
        const delay = ((i * 53) % 90) / 100;
        const duration = 2.6 + ((i * 29) % 14) / 10;
        const color = COLORS[i % COLORS.length];
        const round = i % 3 === 0;
        return (
          <span
            key={i}
            className="absolute top-0 block"
            style={{
              left: `${left}%`,
              width: size,
              height: round ? size : size * 0.55,
              backgroundColor: color,
              borderRadius: round ? "50%" : "2px",
              animation: `confetti-fall ${duration}s ${delay}s cubic-bezier(0.2, 0.6, 0.6, 1) both`,
            }}
          />
        );
      })}
    </div>
  );
}
