import React from 'react';
import { market, subscribe } from '../lib/btc';

const CANDLE = 6; // body width, px
const STEP = 8; // body + gap

const BtcChart = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const priceRef = React.useRef<HTMLSpanElement>(null);
  const statusRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const ink = getComputedStyle(document.documentElement)
      .getPropertyValue('--forest')
      .trim();
    let dirty = true;
    let raf = 0;
    let lastPrice = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!dirty) return;
      dirty = false;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const visible = market.candles.slice(-Math.floor(w / STEP));
      if (visible.length) {
        let lo = Infinity;
        let hi = -Infinity;
        for (const c of visible) {
          lo = Math.min(lo, c.l);
          hi = Math.max(hi, c.h);
        }
        const pad = (hi - lo) * 0.08 || 1;
        lo -= pad;
        hi += pad;
        const y = (p: number) =>
          Math.round(((hi - p) / (hi - lo)) * (h - 1)) + 0.5;

        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.lineWidth = 1;
        const x0 = w - visible.length * STEP;
        visible.forEach((c, i) => {
          const x = Math.round(x0 + i * STEP);
          const mid = x + CANDLE / 2 - 0.5;
          const top = y(Math.max(c.o, c.c));
          const bottom = Math.max(y(Math.min(c.o, c.c)), top + 1);
          // wick above and below the body, so hollow bodies stay hollow
          ctx.beginPath();
          ctx.moveTo(mid, y(c.h));
          ctx.lineTo(mid, top);
          ctx.moveTo(mid, bottom);
          ctx.lineTo(mid, y(c.l));
          ctx.stroke();
          if (c.c >= c.o) ctx.fillRect(x, top - 0.5, CANDLE, bottom - top + 1);
          else ctx.strokeRect(x + 0.5, top, CANDLE - 1, bottom - top);
        });

        // last price
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(0, y(market.last));
        ctx.lineTo(w, y(market.last));
        ctx.stroke();
        ctx.restore();
      }

      if (market.last && market.last !== lastPrice) {
        const arrow = market.last >= lastPrice ? '▲' : '▼';
        priceRef.current.textContent = `${arrow} ${market.last.toLocaleString(
          'en-US',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`;
        lastPrice = market.last;
      }
      statusRef.current.textContent = market.status;
    };

    const unsubscribe = subscribe(() => {
      dirty = true;
    });
    const resize = new ResizeObserver(() => {
      dirty = true;
    });
    resize.observe(canvas);
    raf = requestAnimationFrame(draw);

    return () => {
      unsubscribe();
      resize.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="ticker" aria-label="Live BTC/USDT 1-second candles">
      <div className="ticker__head">
        <span>
          BTC/USDT · 1s · binance · <span ref={statusRef}>connecting</span>
        </span>
        <span className="ticker__price" ref={priceRef} />
      </div>
      <canvas ref={canvasRef} />
    </section>
  );
};

export default BtcChart;
