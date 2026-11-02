export type Craving = "Sweet" | "Savory" | "Salty" | "Fresh" | "Cold";
export const CRAVINGS: Craving[] = ["Sweet", "Savory", "Salty", "Fresh", "Cold"];
export type PriceTier = 1 | 2 | 3;
const MAX_SNACKS = 10;

export interface Position {
  lat: number;
  lon: number;
}

export interface Place extends Position {
  name: string;
  tags: Record<string, string>;
}

export interface Snack {
  icon: string;
  idea: string;
  craving: Craving;
  price: PriceTier;
  place: Place;
  walkMinutes: number;
}

export type SortOrder = "closest" | "cheapest";

export interface Selection {
  craving: Craving | null;
  price: PriceTier | null;
  sort: SortOrder;
}

interface SnackRule {
  matches: string[];
  icon: string;
  idea: string;
  craving: Craving;
  price: PriceTier;
}

// First match wins, so specific kinds of place come before general ones.
const RULES: SnackRule[] = [
  {
    matches: ["ice_cream", "frozen_yogurt", "gelato"],
    icon: "🍨",
    idea: "A scoop of ice cream",
    craving: "Cold",
    price: 2,
  },
  { matches: ["chocolate", "confectionery"], icon: "🍫", idea: "A few chocolates", craving: "Sweet", price: 2 },
  { matches: ["donut"], icon: "🍩", idea: "A donut", craving: "Sweet", price: 1 },
  { matches: ["pastry", "bakery"], icon: "🥐", idea: "A fresh pastry", craving: "Sweet", price: 1 },
  { matches: ["greengrocer"], icon: "🍎", idea: "A piece of fruit", craving: "Fresh", price: 1 },
  { matches: ["juice", "smoothie"], icon: "🥤", idea: "A fresh juice", craving: "Fresh", price: 2 },
  { matches: ["salad", "vegan"], icon: "🥗", idea: "A small salad", craving: "Fresh", price: 2 },
  { matches: ["sushi", "japanese"], icon: "🍙", idea: "Onigiri or a small roll", craving: "Fresh", price: 2 },
  { matches: ["bagel"], icon: "🥯", idea: "A salty everything bagel", craving: "Salty", price: 1 },
  { matches: ["chinese", "dumpling"], icon: "🥟", idea: "A few dumplings", craving: "Salty", price: 2 },
  { matches: ["convenience"], icon: "🥨", idea: "A bag of chips or pretzels", craving: "Salty", price: 1 },
  { matches: ["pizza"], icon: "🍕", idea: "A slice of pizza", craving: "Savory", price: 1 },
  { matches: ["ramen", "noodle"], icon: "🍜", idea: "A bowl of noodles", craving: "Savory", price: 3 },
  { matches: ["mexican", "taco"], icon: "🌮", idea: "A couple of tacos", craving: "Savory", price: 2 },
  { matches: ["sandwich", "deli"], icon: "🥪", idea: "A small sandwich", craving: "Savory", price: 2 },
  { matches: ["burger", "kebab", "hot_dog"], icon: "🍔", idea: "Something hot and quick", craving: "Savory", price: 2 },
  { matches: ["cafe", "coffee_shop"], icon: "☕", idea: "A coffee and a cookie", craving: "Sweet", price: 2 },
];

function placeKinds(tags: Record<string, string>): string[] {
  const cuisines = (tags.cuisine ?? "").split(";").map((cuisine) => cuisine.trim());
  return [tags.amenity, tags.shop, ...cuisines].filter((kind): kind is string => Boolean(kind));
}

function walkMinutesBetween(from: Position, to: Position): number {
  const metersPerDegree = 111320;
  const north = (to.lat - from.lat) * metersPerDegree;
  const east = (to.lon - from.lon) * metersPerDegree * Math.cos((from.lat * Math.PI) / 180);
  const streetDetour = 1.3;
  const metersPerMinute = 80;
  return Math.max(1, Math.round((Math.hypot(north, east) * streetDetour) / metersPerMinute));
}

// Places no rule understands return null, so the app never invents an idea for them.
export function snackFor(place: Place, origin: Position): Snack | null {
  const kinds = placeKinds(place.tags);
  const rule = RULES.find((candidate) => candidate.matches.some((match) => kinds.includes(match)));
  if (!rule) return null;
  const { icon, idea, craving, price } = rule;
  return { icon, idea, craving, price, place, walkMinutes: walkMinutesBetween(origin, place) };
}

function comparator(sort: SortOrder): (a: Snack, b: Snack) => number {
  return sort === "closest"
    ? (a, b) => a.walkMinutes - b.walkMinutes || a.price - b.price
    : (a, b) => a.price - b.price || a.walkMinutes - b.walkMinutes;
}

// Takes the closest of each craving in turn, so a list of "anything" stays varied.
function varied(snacks: Snack[]): Snack[] {
  const closest = comparator("closest");
  const queues = CRAVINGS.map((craving) => snacks.filter((snack) => snack.craving === craving).sort(closest));
  const picks: Snack[] = [];
  while (picks.length < MAX_SNACKS && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && picks.length < MAX_SNACKS) picks.push(next);
    }
  }
  return picks;
}

export function chooseSnacks(snacks: Snack[], selection: Selection): Snack[] {
  const affordable = snacks.filter((snack) => selection.price === null || snack.price === selection.price);
  const chosen =
    selection.craving === null ? varied(affordable) : affordable.filter((snack) => snack.craving === selection.craving);
  return [...chosen].sort(comparator(selection.sort)).slice(0, MAX_SNACKS);
}
