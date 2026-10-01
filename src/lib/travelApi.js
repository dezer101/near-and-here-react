const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const WIKIVOYAGE_URL = 'https://en.wikivoyage.org/w/api.php';

async function readJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Travel service returned ${response.status}.`);
  return response.json();
}

export async function searchLocations(query, signal) {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '7',
    language: 'en',
    format: 'json',
  });
  const data = await readJson(`${GEOCODING_URL}?${params}`, signal);
  return (data.results ?? []).map((place) => ({
    id: String(place.id),
    name: place.name,
    admin1: place.admin1 ?? '',
    country: place.country ?? '',
    countryCode: place.country_code ?? '',
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    timezone: place.timezone ?? 'UTC',
    population: place.population ?? null,
  }));
}

export async function getForecast(place, unit = 'celsius', signal) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: unit,
    wind_speed_unit: unit === 'fahrenheit' ? 'mph' : 'kmh',
  });
  return readJson(`${FORECAST_URL}?${params}`, signal);
}

export async function getTravelNote(place, signal) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    exchars: '720',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    origin: '*',
    titles: place.name,
  });
  const data = await readJson(`${WIKIVOYAGE_URL}?${params}`, signal);
  const page = data.query?.pages?.[0];
  const summary = page?.extract?.trim();
  if (!summary || page?.missing) return null;
  return {
    title: page.title,
    text: summary,
    url: `https://en.wikivoyage.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
  };
}

export function describeWeatherCode(code) {
  if (code === 0) return 'Clear sky';
  if ([1, 2].includes(code)) return 'Mostly clear';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Misty';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Light drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain nearby';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorms';
  return 'Current conditions';
}

export function weatherGlyph(code) {
  if (code === 0) return '☀';
  if ([1, 2].includes(code)) return '◐';
  if ([45, 48].includes(code)) return '≋';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '☂';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄';
  if ([95, 96, 99].includes(code)) return 'ϟ';
  return '☁';
}

export function getLocalTime(timezone) {
  try {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    }).format(new Date());
  } catch {
    return '—';
  }
}
