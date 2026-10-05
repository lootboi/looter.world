// GET /api/weather: current weather where the visitor is, from Cloudflare's
// IP geolocation (request.cf) and Open-Meteo. No browser location prompt.
// ponytail: no caching; Open-Meteo allows ~10k calls/day free. Cache by rounded
// lat/long in caches.default if traffic ever gets near that.

const SKY = [
  [0, 'clear'],
  [3, 'partly cloudy'],
  [48, 'fog'],
  [57, 'drizzle'],
  [67, 'rain'],
  [77, 'snow'],
  [82, 'showers'],
  [86, 'snow showers'],
  [99, 'thunderstorms'],
];
const FAHRENHEIT = new Set(['US', 'LR', 'MM']);

export async function onRequestGet({ request }) {
  const cf = request.cf || {};
  if (!cf.latitude || !cf.longitude) {
    return Response.json({ error: 'no location' }, { status: 404 });
  }

  const imperial = FAHRENHEIT.has(cf.country);
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: cf.latitude,
    longitude: cf.longitude,
    current: 'temperature_2m,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
    temperature_unit: imperial ? 'fahrenheit' : 'celsius',
    wind_speed_unit: imperial ? 'mph' : 'kmh',
  });

  const res = await fetch(url);
  if (!res.ok) {
    return Response.json({ error: 'weather unavailable' }, { status: 502 });
  }
  const { current, daily } = await res.json();
  const code = current.weather_code;

  return Response.json(
    {
      place: [cf.city, cf.regionCode || cf.country].filter(Boolean).join(', '),
      temp: Math.round(current.temperature_2m),
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      unit: imperial ? '°F' : '°C',
      sky: (SKY.find(([max]) => code <= max) || [0, 'weather'])[1],
      wind: Math.round(current.wind_speed_10m),
      windUnit: imperial ? 'mph' : 'km/h',
    },
    { headers: { 'cache-control': 'private, max-age=600' } },
  );
}
