"use client";
import { useEffect, useState } from "react";

const COLORS = ["#dc2626", "#f59e0b", "#8b5cf6", "#22c55e", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  vx: number;
  vy: number;
}

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const initial: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 40,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.3 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 6 - 2,
    }));
    setParticles(initial);

    let frame: number;
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx * 0.15,
          y: p.y + p.vy * 0.15,
          vy: p.vy + 0.15,
          rotation: p.rotation + 5,
        })).filter((p) => p.y < 120)
      );
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    setTimeout(() => cancelAnimationFrame(frame), 3000);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 8,
            height: 8,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          }}
        />
      ))}
    </div>
  );
}
