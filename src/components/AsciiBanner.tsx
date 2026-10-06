import React from 'react';
import { subscribe } from '../lib/btc';

const RAMP = ' .:-=+*#%@';

// Rasterize `word` onto a cols×rows grid of cell coverage (0..1). Characters are
// taller than wide, so the text is stretched by `aspect` to look right on screen.
const rasterize = (
  word: string,
  cols: number,
  rows: number,
  aspect: number,
) => {
  const S = 4; // supersample each cell 4×4 for soft edges
  const canvas = document.createElement('canvas');
  canvas.width = cols * S;
  canvas.height = rows * S;
  const ctx = canvas.getContext('2d');

  ctx.font = '400 100px "Archivo Black"';
  const width100 = ctx.measureText(word).width;
  const size = Math.min(
    (canvas.height * 0.82) / 0.72, // cap height is ~0.72em
    (canvas.width * 0.94) / ((width100 / 100) * aspect),
  );
  ctx.font = `400 ${size}px "Archivo Black"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.setTransform(aspect, 0, 0, 1, canvas.width / 2, canvas.height / 2);
  ctx.fillText(word, 0, size * 0.04);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mask = new Float32Array(cols * rows);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      mask[Math.floor(y / S) * cols + Math.floor(x / S)] +=
        data[(y * canvas.width + x) * 4 + 3] / 255 / (S * S);
    }
  }
  return mask;
};

const AsciiBanner = ({ word }: { word: string }) => {
  const ref = React.useRef<HTMLPreElement>(null);

  React.useEffect(() => {
    const pre = ref.current;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0, on: 0, strength: 0 };
    let cols = 0;
    let rows = 0;
    let cellW = 1;
    let cellH = 1;
    let aspect = 1;
    let mask = new Float32Array(0);
    let raf = 0;
    // Market reactivity: every BTC trade sends a ring through the letters (up-ticks
    // brighten, down-ticks carve), and bursts of trades speed up the shimmer.
    type Ring = {
      x: number;
      y: number;
      born: number;
      amp: number;
      up: boolean;
    };
    const rings: Ring[] = [];
    let energy = 0;
    let phase = 0;
    let lastNow = 0;

    const layout = () => {
      const style = getComputedStyle(pre);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      cellW = ctx.measureText('M').width;
      cellH = parseFloat(style.lineHeight);
      aspect = cellH / cellW;
      cols = Math.floor(pre.clientWidth / cellW);
      rows = Math.floor(pre.clientHeight / cellH);
      mask = rasterize(word, cols, rows, aspect);
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const dt = lastNow ? Math.min(0.1, t - lastNow) : 0;
      lastNow = t;
      energy *= Math.pow(0.05, dt); // fades out over ~1s
      phase += dt * (1 + energy * 4);
      while (rings.length && t - rings[0].born > 1.4) rings.shift();
      pointer.strength += (pointer.on - pointer.strength) * (still ? 1 : 0.08);
      let out = '';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = x - pointer.x;
          const dy = (y - pointer.y) * aspect;
          const d = Math.hypot(dx, dy);
          const near = pointer.strength * Math.exp(-d / 9);
          // magnifier: sample closer to the cursor, so letters swell under it
          const sx = Math.round(x - dx * near * 0.5);
          const sy = Math.round(y - (dy / aspect) * near * 0.5);
          const m =
            sx >= 0 && sx < cols && sy >= 0 && sy < rows
              ? mask[sy * cols + sx]
              : 0;
          const swell = still
            ? 0.5
            : 0.5 +
              0.5 *
                Math.sin(x * 0.13 + phase * 1.1) *
                Math.sin(y * 0.4 - phase * 0.7);
          const ripple = still
            ? 0
            : near * (0.5 + 0.5 * Math.sin(d * 0.9 - t * 7));
          let trades = 0;
          for (const ring of rings) {
            const age = t - ring.born;
            const off =
              Math.hypot(x - ring.x, (y - ring.y) * aspect) - age * 30;
            const wave =
              ring.amp * Math.exp(-(off * off) / 5) * (1 - age / 1.4);
            trades += ring.up ? wave : -wave * m;
          }
          // the swell only shimmers inside the letters; the background stays empty
          const lift = Math.min(energy, 1) * 0.15;
          const v = Math.max(
            0,
            Math.min(
              1,
              m * (0.72 - lift + (0.28 + lift) * swell) +
                ripple * 0.55 +
                trades,
            ),
          );
          out += RAMP[Math.floor(v * (RAMP.length - 1))];
        }
        out += '\n';
      }
      pre.textContent = out;
    };

    // ponytail: animates even when scrolled out of view; rAF already pauses in
    // background tabs. Gate on an IntersectionObserver if it ever costs battery.
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = pre.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / cellW;
      pointer.y = (e.clientY - r.top) / cellH;
      pointer.on = e.clientY > r.top - 80 && e.clientY < r.bottom + 80 ? 1 : 0;
      if (still) draw(performance.now());
    };
    const onLeave = () => {
      pointer.on = 0;
      if (still) draw(performance.now());
    };

    const resize = new ResizeObserver(() => {
      layout();
      if (still) draw(performance.now());
    });

    const onTick = (tick?: { up: boolean; impulse: number }) => {
      if (still || !tick || !cols) return;
      energy = Math.min(1.5, energy + tick.impulse * 0.5);
      // start the ring somewhere inside the letters
      let i = 0;
      for (let tries = 0; tries < 12; tries++) {
        i = Math.floor(Math.random() * cols * rows);
        if (mask[i] > 0.5) break;
      }
      rings.push({
        x: i % cols,
        y: Math.floor(i / cols),
        born: performance.now() / 1000,
        amp: 0.35 + tick.impulse * 0.9,
        up: tick.up,
      });
      if (rings.length > 24) rings.shift();
    };

    let cancelled = false;
    let unsubscribe = () => undefined;
    Promise.all([
      document.fonts.load('400 100px "Archivo Black"'),
      document.fonts.load('500 12px "JetBrains Mono"'),
    ]).finally(() => {
      if (cancelled) return;
      layout();
      resize.observe(pre);
      unsubscribe = subscribe(onTick);
      addEventListener('pointermove', onMove);
      document.documentElement.addEventListener('pointerleave', onLeave);
      if (still) draw(performance.now());
      else raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      cancelAnimationFrame(raf);
      resize.disconnect();
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [word]);

  return <pre ref={ref} className="banner" aria-hidden="true" />;
};

export default AsciiBanner;
