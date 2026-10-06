// Live BTC/USDT from Binance's market-data mirrors (binance.vision), which allow
// browser requests and, unlike api.binance.com, are not blocked for US visitors.
// History comes from 1s klines; after that, candles are built from raw trades so
// every trade can drive the animation.

export type Fill = { t: number; p: number; q: number; buy: boolean };
export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  // Fills: undefined until known. Live candles record them from the stream;
  // older ones are fetched (aggregated by price) on first hover.
  fills?: Fill[]; // most recent first, at most KEEP
  rows?: number; // fill rows in total (aggregated rows for fetched candles)
  n?: number; // raw fills
  vol?: number;
  buyVol?: number;
  agg?: boolean;
};
export type Tick = { price: number; up: boolean; impulse: number }; // impulse 0..1

const HISTORY =
  'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1s&limit=240';
const TRADES = 'wss://data-stream.binance.vision/ws/btcusdt@trade';
const MAX = 240;
const KEEP = 50;
const AGG_TRADES =
  'https://data-api.binance.vision/api/v3/aggTrades?symbol=BTCUSDT&limit=1000';

const empty = () => ({ fills: [] as Fill[], rows: 0, n: 0, vol: 0, buyVol: 0 });

const addFill = (candle: Candle, fill: Fill, raw: number) => {
  candle.fills.unshift(fill);
  if (candle.fills.length > KEEP) candle.fills.pop();
  candle.rows += 1;
  candle.n += raw;
  candle.vol += fill.q;
  if (fill.buy) candle.buyVol += fill.q;
};

// A new connection may have missed earlier trades in its first second.
let streamFresh = true;

export const market = {
  candles: [] as Candle[],
  last: 0,
  status: 'connecting',
};

const listeners = new Set<(tick?: Tick) => void>();
const notify = (tick?: Tick) => listeners.forEach((fn) => fn(tick));

// Moves are judged against recent activity, so a quiet market still reacts.
let moveAvg = 0;
let qtyAvg = 0;

const onTrade = (price: number, qty: number, time: number, buy: boolean) => {
  const candles = market.candles;
  const second = Math.floor(time / 1000) * 1000;
  let candle = candles[candles.length - 1];

  if (!candle || second > candle.t) {
    // Seconds without trades are flat candles at the previous close, as Binance shows them.
    if (candle) {
      const from = Math.max(candle.t + 1000, second - MAX * 1000);
      for (let t = from; t < second; t += 1000) {
        candles.push({
          t,
          o: candle.c,
          h: candle.c,
          l: candle.c,
          c: candle.c,
          ...(streamFresh ? {} : empty()),
        });
      }
    }
    candle = {
      t: second,
      o: price,
      h: price,
      l: price,
      c: price,
      ...(streamFresh ? {} : empty()),
    };
    candles.push(candle);
    if (candles.length > MAX) candles.splice(0, candles.length - MAX);
  } else if (second === candle.t) {
    candle.h = Math.max(candle.h, price);
    candle.l = Math.min(candle.l, price);
    candle.c = price;
  }
  streamFresh = false;
  if (second === candle.t && candle.fills) {
    addFill(candle, { t: time, p: price, q: qty, buy }, 1);
  }

  const previous = market.last || price;
  const move = Math.abs(price - previous);
  moveAvg = moveAvg ? moveAvg * 0.95 + move * 0.05 : move;
  qtyAvg = qtyAvg ? qtyAvg * 0.95 + qty * 0.05 : qty;
  const impulse = Math.min(
    1,
    (move / (moveAvg * 3 || 1)) * 0.7 + (qty / (qtyAvg * 5 || 1)) * 0.3,
  );

  market.last = price;
  notify({ price, up: price >= previous, impulse });
};

const connect = () => {
  const ws = new WebSocket(TRADES);
  streamFresh = true;
  ws.onopen = () => {
    market.status = 'live';
    notify();
  };
  ws.onmessage = (e) => {
    const trade = JSON.parse(e.data);
    // m: buyer is the maker, so the taker sold
    onTrade(parseFloat(trade.p), parseFloat(trade.q), trade.T, !trade.m);
  };
  ws.onclose = () => {
    market.status = 'reconnecting';
    notify();
    setTimeout(connect, 2000);
  };
};

let started = false;
const start = () => {
  if (started) return;
  started = true;
  connect();
  fetch(HISTORY)
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((rows: string[][]) => {
      const history = rows.map(([t, o, h, l, c]) => ({
        t: +t,
        o: +o,
        h: +h,
        l: +l,
        c: +c,
      }));
      // keep any candles the trade stream already built
      const firstLive = market.candles[0]?.t ?? Infinity;
      market.candles = [
        ...history.filter((c) => c.t < firstLive),
        ...market.candles,
      ].slice(-MAX);
      market.last = market.last || history[history.length - 1]?.c || 0;
      notify();
    })
    .catch(() => undefined);
};

export const subscribe = (fn: (tick?: Tick) => void) => {
  start();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const loading = new Map<number, Promise<Candle>>();

// Fills for a candle the stream did not see from its first trade.
export const loadFills = (candle: Candle): Promise<Candle> => {
  if (candle.fills) return Promise.resolve(candle);
  if (!loading.has(candle.t)) {
    const url = `${AGG_TRADES}&startTime=${candle.t}&endTime=${candle.t + 999}`;
    loading.set(
      candle.t,
      fetch(url)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(
          (
            rows: {
              p: string;
              q: string;
              T: number;
              m: boolean;
              f: number;
              l: number;
            }[],
          ) => {
            Object.assign(candle, empty(), { agg: true });
            for (const r of rows) {
              addFill(
                candle,
                { t: r.T, p: +r.p, q: +r.q, buy: !r.m },
                r.l - r.f + 1,
              );
            }
            return candle;
          },
        )
        .finally(() => loading.delete(candle.t)),
    );
  }
  return loading.get(candle.t);
};
