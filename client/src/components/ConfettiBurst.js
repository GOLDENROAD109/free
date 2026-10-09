import { useEffect, useRef } from 'react';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#fb923c', '#e879f9'];

/**
 * High-fidelity, dependency-free confetti particle celebration.
 * Fires a full-viewport canvas burst whenever `nonce` changes.
 */
export default function ConfettiBurst({ nonce = 0, particleCount = 170, duration = 3400 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!nonce) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: -24 - Math.random() * 140,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vy: 2.2 + Math.random() * 3.4,
      vx: -1.6 + Math.random() * 3.2,
      rot: Math.random() * Math.PI * 2,
      vr: -0.14 + Math.random() * 0.28,
      tilt: Math.random() * Math.PI * 2,
      shape: Math.random() < 0.3 ? 'circle' : 'rect',
    }));

    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach((p) => {
        if (p.y > height + 48) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.055; // gravity
        p.vx *= 0.999; // air drag
        p.rot += p.vr;
        p.tilt += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(p.tilt);
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      });

      if (alive && elapsed < duration) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, width, height);
    };
  }, [nonce, particleCount, duration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] h-full w-full"
    />
  );
}
