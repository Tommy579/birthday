import { useEffect, useRef } from "react";

const COLORS = ["#F2C260", "#E7A2B4", "#FFF7EC", "#C97C92"];

function heartPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(0, -s * 0.1, -s * 0.9, -s * 0.15, -s * 0.9, s * 0.35);
  ctx.bezierCurveTo(-s * 0.9, s * 0.8, -s * 0.2, s * 1.05, 0, s * 1.35);
  ctx.bezierCurveTo(s * 0.2, s * 1.05, s * 0.9, s * 0.8, s * 0.9, s * 0.35);
  ctx.bezierCurveTo(s * 0.9, -s * 0.15, 0, -s * 0.1, 0, s * 0.3);
  ctx.closePath();
}

export default function Confetti({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const parts = [];
    const rnd = (a, b) => a + Math.random() * (b - a);

    const burst = (cx, cy, count, spread, power) => {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + rnd(-spread, spread);
        const v = rnd(power * 0.45, power);
        parts.push({
          x: cx + rnd(-30, 30),
          y: cy + rnd(-20, 20),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          size: rnd(6, 13),
          rot: rnd(0, Math.PI * 2),
          vr: rnd(-4, 4),
          color: COLORS[(Math.random() * COLORS.length) | 0],
          heart: Math.random() > 0.42,
          life: rnd(2.6, 4.4),
          age: 0,
          sway: rnd(0.6, 2),
          phase: rnd(0, Math.PI * 2),
          drag: rnd(0.9, 1.6),
        });
      }
    };

    if (reduce) {
      burst(w / 2, h * 0.55, 26, 0.9, 260);
    } else {
      burst(w / 2, h * 0.66, Math.min(150, Math.round(w / 4)),
        Math.PI * 0.42, Math.max(520, h * 0.95));
      setTimeout(() => burst(w * 0.18, h * 0.5, 45, 0.9, 620), 220);
      setTimeout(() => burst(w * 0.82, h * 0.5, 45, 0.9, 620), 380);
    }

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      ctx.clearRect(0, 0, w, h);

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age > p.life) {
          parts.splice(i, 1);
          continue;
        }
        if (!reduce) {
          p.vy += 900 * dt;
          p.vx *= 1 - 0.9 * dt * (p.drag / 1.6);
          p.vy *= 1 - 0.35 * dt;
          p.vx += Math.sin(elapsed * p.sway * 2 + p.phase) * 26 * dt;
          p.rot += p.vr * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const fade = Math.min(1, Math.max(0, (p.life - p.age) / 0.7));
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.heart) {
          heartPath(ctx, p.size * 0.62);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size * 0.32, -p.size * 0.9, p.size * 0.64, p.size * 1.5);
        }
        ctx.restore();
      }

      if (parts.length && elapsed < 9) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
        onDone?.();
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [onDone]);

  return <canvas className="confetti" ref={canvasRef} aria-hidden="true" />;
}
