'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AppLaunchSplashProps {
  onComplete?: () => void;
  autoDismiss?: boolean;
}

export function AppLaunchSplash({ onComplete, autoDismiss = true }: AppLaunchSplashProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const time0Ref = useRef<number>(performance.now());
  const completedRef = useRef(false);

  const CFG = {
    duration: 1.966667,
    background: '#673AB7',
    name: 'StaffTrack',
    font: 'Roboto, Arial, sans-serif',
    white: '#FFFFFF',
  };

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFading(true);
    setTimeout(() => {
      setIsFinished(true);
      onComplete?.();
    }, 400);
  }, [onComplete]);

  const handleRestart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    completedRef.current = false;
    setIsFading(false);
    time0Ref.current = performance.now();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d', { alpha: false });
    if (!g) return;

    const logo = new Image();
    logo.src = '/logo.png';

    const sat = (v: number) => Math.max(0, Math.min(1, v));
    const ease = (t: number) => 1 - Math.pow(1 - sat(t), 3);
    const sm = (t: number) => {
      t = sat(t);
      return t * t * (3 - 2 * t);
    };
    const spring = (t: number) => {
      t = sat(t);
      return 1 + Math.exp(-7 * t) * Math.sin(15 * t) * 0.115 - (1 - t) ** 4;
    };

    function resize() {
      if (!canvas || !g) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    logo.onload = () => {
      time0Ref.current = performance.now();
    };

    function paint(t: number) {
      if (!g) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const unit = Math.min(w / 390, h / 844);

      g.fillStyle = CFG.background;
      g.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.466;
      const icon = Math.min(Math.max(94 * unit, 70), 140);
      const fontSize = Math.min(Math.max(35 * unit, 27), 53);
      g.font = `500 ${fontSize}px ${CFG.font}`;
      const textWidth = g.measureText(CFG.name).width;
      const gap = Math.max(11, 12 * unit);
      const groupW = icon + gap + textWidth;
      const groupScale = Math.min(1, (w - 44) / groupW);
      const sz = icon * groupScale;
      const fs = fontSize * groupScale;
      const sp = gap * groupScale;
      g.font = `500 ${fs}px ${CFG.font}`;
      const wordW = g.measureText(CFG.name).width;
      const shift = sm((t - 1.265) / 0.175);

      // Horizontal lock-up: initially centered icon, easing toward left
      const logoX = cx - ((wordW + sp) * shift) / 2;
      const wordX = logoX + sz / 2 + sp;

      // Fast assembled logo arrival — directional image echoes
      if (t >= 0.11 && t < 0.37 && logo.complete) {
        const u = sat((t - 0.11) / 0.26);
        const arr = ease(u);
        const a = 1 - sm((t - 0.285) / 0.085);
        const dirs = [
          [-1.1, -1.0],
          [1.12, -0.45],
          [0.1, 1.3],
        ];
        dirs.forEach(([dx, dy], i) => {
          const travel = (1 - arr) * sz * 1.48;
          g.save();
          g.translate(cx + dx * travel, cy + dy * travel);
          g.rotate((1 - arr) * (i - 1) * 1.15);
          g.globalAlpha = (a * 0.18 * (i + 2)) / 3;
          try {
            if ('filter' in g) {
              (g as any).filter = `blur(${Math.max(0, (1 - arr) * 9)}px)`;
            }
          } catch {}
          const sc = 0.65 + 0.33 * arr;
          g.drawImage(logo, (-sz * sc) / 2, (-sz * sc) / 2, sz * sc, sz * sc);
          g.restore();
        });
      }

      // Crisp brand logo arrival & spring settle
      if (t >= 0.205 && logo.complete) {
        const p = sat((t - 0.205) / 0.245);
        const arrival = spring(p);
        const vibrateT = Math.max(0, t - 0.41);
        const decay = Math.exp(-17 * vibrateT);
        const active = t >= 0.41 && t < 0.8 ? 1 : 0;
        const x = Math.sin(vibrateT * 94) * sz * 0.022 * decay * active;
        const y = Math.cos(vibrateT * 87) * sz * 0.01 * decay * active;
        const rot = Math.sin(vibrateT * 102) * 0.018 * decay * active;
        g.save();
        g.translate(logoX + x, cy + y);
        g.rotate(rot);
        g.globalAlpha = sm((t - 0.205) / 0.095);
        const finalSize = sz * arrival;
        g.drawImage(logo, -finalSize / 2, -finalSize / 2, finalSize, finalSize);
        g.restore();
      }

      // Radial background wash
      if (t > 0.44 && t < 1.0) {
        const strength = Math.sin(Math.PI * sat((t - 0.44) / 0.56)) * 0.075;
        const glow = g.createRadialGradient(cx, cy, sz * 0.1, cx, cy, Math.max(w, h) * 0.43);
        glow.addColorStop(0, `rgba(221,206,255,${strength})`);
        glow.addColorStop(1, 'rgba(221,206,255,0)');
        g.fillStyle = glow;
        g.fillRect(0, 0, w, h);
      }

      // Left-to-right motion-blurred word wipe
      const start = 1.31;
      const end = 1.625;
      const reveal = sat((t - start) / (end - start));
      if (reveal > 0) {
        const visible = wordW * sm(reveal);
        const dx = (1 - ease(reveal)) * fs * 0.32;
        g.save();
        g.beginPath();
        g.rect(wordX - 2, cy - fs * 0.85, visible + 3, fs * 1.7);
        g.clip();
        g.font = `500 ${fs}px ${CFG.font}`;
        g.textBaseline = 'middle';
        g.fillStyle = '#fff';
        g.globalAlpha = sm((t - start) / 0.12);
        g.shadowColor = '#e3d2ff';
        g.shadowBlur = (1 - reveal) * fs * 0.38;
        g.fillText(CFG.name, wordX + dx, cy + fs * 0.015);
        g.restore();
      }
    }

    function frame() {
      const elapsed = (performance.now() - time0Ref.current) / 1000;
      const t = Math.min(elapsed, CFG.duration);
      paint(t);

      // Auto-dismiss smoothly into the login screen once duration completes
      if (elapsed >= CFG.duration + 0.35 && autoDismiss && !completedRef.current) {
        handleFinish();
      }

      animFrameRef.current = requestAnimationFrame(frame);
    }

    animFrameRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [autoDismiss, handleFinish]);

  if (isFinished) return null;

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[100] overflow-hidden cursor-pointer select-none transition-opacity duration-400 ease-in-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: CFG.background }}
      title="Click anywhere to continue"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Action button matching provided specification */}
      <div
        className="fixed z-10 flex items-center gap-2.5"
        style={{
          right: '18px',
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
        }}
      >
        <button
          type="button"
          onClick={handleRestart}
          className="border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-4 py-2 rounded-full font-medium text-sm backdrop-blur-md transition-all cursor-pointer shadow-md"
          title="Replay launch animation"
        >
          ↻ Replay
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="border border-white/20 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-4 py-2 rounded-full font-medium text-sm backdrop-blur-md transition-all cursor-pointer shadow-md"
          title="Skip to login"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
