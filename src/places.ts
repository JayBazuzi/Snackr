import type { Place, Position } from "./snacks";

const AMENITIES = "fast_food|cafe|restaurant|ice_cream";
const SHOPS = "bakery|pastry|chocolate|confectionery|deli|greengrocer|convenience";
const SEARCH_METERS = 800;
const SERVER_TIMEOUT_MILLISECONDS = 12000;
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: Position;
  tags?: Record<string, string>;
}

function overpassQuery({ lat, lon }: Position): string {
  const around = `(around:${SEARCH_METERS},${lat},${lon})`;
  return `[out:json][timeout:20];(
    nwr["amenity"~"^(${AMENITIES})$"]["name"]${around};
    nwr["shop"~"^(${SHOPS})$"]["name"]${around};
  );out center 200;`;
}

function toPlaces(elements: OverpassElement[]): Place[] {
  return elements.flatMap(({ lat, lon, center, tags }) => {
    const position = lat !== undefined && lon !== undefined ? { lat, lon } : center;
    return position && tags?.name ? [{ ...position, name: tags.name, tags }] : [];
  });
}

async function searchServer(server: string, origin: Position): Promise<Place[]> {
  const response = await fetch(server, {
    method: "POST",
    body: new URLSearchParams({ data: overpassQuery(origin) }),
    signal: AbortSignal.timeout(SERVER_TIMEOUT_MILLISECONDS),
  });
  if (!response.ok) throw new Error(`${server} answered ${response.status}`);
  const { elements } = (await response.json()) as { elements: OverpassElement[] };
  return toPlaces(elements);
}

// The public Overpass servers are often busy, so each one is a fallback for the last.
export async function fetchPlaces(origin: Position): Promise<Place[]> {
  for (const server of OVERPASS_SERVERS) {
    try {
      return await searchServer(server, origin);
    } catch (error) {
      console.warn(error);
    }
  }
  throw new Error("The map servers are busy right now. Try again in a moment.");
}

export async function findPosition(search: string): Promise<Position> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`The location search failed (${response.status}). Try again in a moment.`);
  const [match] = (await response.json()) as { lat: string; lon: string }[];
  if (!match) throw new Error(`Couldn't find "${search}". Try another place.`);
  return { lat: Number(match.lat), lon: Number(match.lon) };
}
