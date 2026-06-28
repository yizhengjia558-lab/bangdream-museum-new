"use client";

const ORBS = [
  { left: "8%", top: "18%", size: 120, delay: 0, color: "rgba(233, 67, 94, 0.35)" },
  { left: "82%", top: "12%", size: 90, delay: 1.2, color: "rgba(255, 107, 138, 0.28)" },
  { left: "72%", top: "58%", size: 140, delay: 2.4, color: "rgba(123, 47, 190, 0.22)" },
  { left: "15%", top: "68%", size: 100, delay: 0.8, color: "rgba(255, 182, 193, 0.3)" },
  { left: "48%", top: "32%", size: 70, delay: 1.8, color: "rgba(255, 255, 255, 0.18)" },
  { left: "35%", top: "82%", size: 80, delay: 3.1, color: "rgba(233, 67, 94, 0.2)" },
];

export function FloatingLightOrbs() {
  return (
    <div className="home-floating-orbs" aria-hidden>
      {ORBS.map((orb, i) => (
        <span
          key={i}
          className="home-floating-orb"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
