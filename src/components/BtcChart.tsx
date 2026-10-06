import React from 'react';
import { Candle, loadFills, market, subscribe } from '../lib/btc';

const CANDLE = 6; // body width, px
const STEP = 8; // body + gap
const ROWS = 12; // fill rows shown in the popup

const price = (n: number) =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const clock = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour12: false });

const popup = (c: Candle, state: 'ready' | 'loading' | 'failed') => {
  const head = `<div class="fills__head">${clock(
    c.t,
  )} <span>· 1s candle</span></div>
    <table class="fills__ohlc">
      <tr><td>O</td><td>${price(c.o)}</td><td>H</td><td>${price(c.h)}</td></tr>
      <tr><td>L</td><td>${price(c.l)}</td><td>C</td><td>${price(c.c)}</td></tr>
    </table>`;
  if (state === 'loading')
    return `${head}<div class="fills__sum">loading fills…</div>`;
  if (state === 'failed')
    return `${head}<div class="fills__sum">fills unavailable</div>`;
  if (!c.n) return `${head}<div class="fills__sum">no fills this second</div>`;

  const buyPct = Math.round((c.buyVol / c.vol) * 100);
  const rows = c.fills
    .slice(0, ROWS)
    .map(
      (f) => `<tr class="${f.buy ? 'buy' : 'sell'}">
        <td>.${String(f.t % 1000).padStart(3, '0')}</td>
        <td>${f.buy ? '▲ buy' : '▼ sell'}</td>
        <td>${price(f.p)}</td>
        <td>${f.q.toFixed(5)}</td>
      </tr>`,
    )
    .join('');
  const more = c.rows - Math.min(ROWS, c.fills.length);
  return `${head}
    <div class="fills__sum">${c.n} fill${
    c.n === 1 ? '' : 's'
  } · ${c.vol.toFixed(4)} BTC · ${buyPct}% buy${
    c.agg ? '<br><span>rows aggregated by price</span>' : ''
  }</div>
    <table class="fills__rows">${rows}</table>
    ${more > 0 ? `<div class="fills__more">+${more} more</div>` : ''}`;
};

const BtcChart = () => {
  const boxRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const priceRef = React.useRef<HTMLSpanElement>(null);
  const statusRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const tip = tipRef.current;
    const ctx = canvas.getContext('2d');
    const ink = getComputedStyle(document.documentElement)
      .getPropertyValue('--forest')
      .trim();
    const hover = { t: 0, x: 0, y: 0, failed: 0 };
    let visible: Candle[] = [];
    let x0 = 0;
    let dirty = true;
    let raf = 0;
    let lastPrice = 0;

    const showTip = () => {
      const c = hover.t && market.candles.find((k) => k.t === hover.t);
      if (!c) {
        tip.hidden = true;
        return;
      }
      if (!c.fills && hover.failed !== c.t) {
        loadFills(c)
          .catch(() => {
            hover.failed = c.t;
          })
          .finally(() => {
            dirty = true;
          });
      }
      tip.innerHTML = popup(
        c,
        c.fills ? 'ready' : hover.failed === c.t ? 'failed' : 'loading',
      );
      tip.hidden = false;
      // beside the pointer, flipped left near the right edge
      const room = box.clientWidth;
      const left =
        hover.x + 16 + tip.offsetWidth > room
          ? hover.x - 16 - tip.offsetWidth
          : hover.x + 16;
      tip.style.left = `${Math.max(0, left)}px`;
      tip.style.top = `${Math.max(0, hover.y + 12)}px`;
    };

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

      visible = market.candles.slice(-Math.floor(w / STEP));
      x0 = w - visible.length * STEP;
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

          if (c.t === hover.t) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(mid, 0);
            ctx.lineTo(mid, h);
            ctx.stroke();
            ctx.restore();
          }
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
        priceRef.current.textContent = `${arrow} ${price(market.last)}`;
        lastPrice = market.last;
      }
      statusRef.current.textContent = market.status;
      if (hover.t) showTip();
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const i = Math.floor((e.clientX - r.left - x0) / STEP);
      hover.t = visible[i]?.t ?? 0;
      hover.x = e.clientX - b.left;
      hover.y = e.clientY - b.top;
      dirty = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // touch keeps the popup until a tap elsewhere
      hover.t = 0;
      tip.hidden = true;
      dirty = true;
    };
    const onTapAway = (e: PointerEvent) => {
      if (e.target !== canvas && hover.t) {
        hover.t = 0;
        tip.hidden = true;
        dirty = true;
      }
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerdown', onTapAway);
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
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerdown', onTapAway);
    };
  }, []);

  return (
    <section
      className="ticker"
      ref={boxRef}
      aria-label="Live BTC/USDT 1-second candles"
    >
      <div className="ticker__head">
        <span>
          BTC/USDT · 1s · binance · <span ref={statusRef}>connecting</span>
        </span>
        <span className="ticker__price" ref={priceRef} />
      </div>
      <canvas ref={canvasRef} />
      <div className="fills" ref={tipRef} role="tooltip" hidden />
    </section>
  );
};

export default BtcChart;
