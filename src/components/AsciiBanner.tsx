import React from 'react';

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
              0.5 * Math.sin(x * 0.13 + t * 1.1) * Math.sin(y * 0.4 - t * 0.7);
          const ripple = still
            ? 0
            : near * (0.5 + 0.5 * Math.sin(d * 0.9 - t * 7));
          // the swell only shimmers inside the letters; the background stays empty
          const v = Math.min(1, m * (0.72 + 0.28 * swell) + ripple * 0.55);
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

    let cancelled = false;
    Promise.all([
      document.fonts.load('400 100px "Archivo Black"'),
      document.fonts.load('500 12px "JetBrains Mono"'),
    ]).finally(() => {
      if (cancelled) return;
      layout();
      resize.observe(pre);
      addEventListener('pointermove', onMove);
      document.documentElement.addEventListener('pointerleave', onLeave);
      if (still) draw(performance.now());
      else raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [word]);

  return <pre ref={ref} className="banner" aria-hidden="true" />;
};

export default AsciiBanner;
