import { describeHours, type Hours } from "./hours";
import { fetchPlaces, findPosition } from "./places";
import {
  chooseSnacks,
  CRAVINGS,
  snackFor,
  type Craving,
  type Place,
  type Position,
  type PriceTier,
  type Snack,
  type SortOrder,
} from "./snacks";
import "./style.css";

const SURPRISE_ME = "Surprise me";

interface OpenSnack extends Snack {
  hours: Hours;
}

let snacks: OpenSnack[] = [];
let craving: Craving | null = null;
let snacksLoaded = false;

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const locationLabel = byId("location");
const placeForm = byId<HTMLFormElement>("place-form");
const placeInput = byId<HTMLInputElement>("place");
const cravingChips = byId("craving");
const priceSelect = byId<HTMLSelectElement>("price");
const sortSelect = byId<HTMLSelectElement>("sort");
const statusLine = byId("status");
const snackList = byId("snacks");

function element(tag: string, className: string, text: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function directionsLink({ lat, lon, name }: Place): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "place";
  link.textContent = name;
  link.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
  link.target = "_blank";
  link.rel = "noopener";
  return link;
}

function snackItem(snack: OpenSnack): HTMLElement {
  const facts = [`${snack.walkMinutes} min walk`, "$".repeat(snack.price), snack.craving, snack.hours.label];
  const item = document.createElement("li");
  item.append(
    element("div", "icon", snack.icon),
    element("div", "idea", snack.idea),
    directionsLink(snack.place),
    element("div", "facts", facts.join(" · ")),
  );
  return item;
}

function renderSnacks(): void {
  if (!snacksLoaded) return;
  const price = priceSelect.value ? (Number(priceSelect.value) as PriceTier) : null;
  const chosen = chooseSnacks(snacks, { craving, price, sort: sortSelect.value as SortOrder }) as OpenSnack[];
  statusLine.textContent = chosen.length
    ? `${chosen.length} snack idea${chosen.length === 1 ? "" : "s"} nearby`
    : "Nothing matches. Try another price or craving.";
  snackList.replaceChildren(...chosen.map(snackItem));
}

function renderCravingChips(): void {
  cravingChips.querySelectorAll("button").forEach((button) => {
    const pressed = button.textContent === (craving ?? SURPRISE_ME);
    button.setAttribute("aria-pressed", String(pressed));
  });
}

async function openSnacksNear(origin: Position): Promise<OpenSnack[]> {
  const now = new Date();
  const places = await fetchPlaces(origin);
  return places
    .flatMap((place) => {
      const snack = snackFor(place, origin);
      return snack ? [{ ...snack, hours: describeHours(place.tags.opening_hours, now) }] : [];
    })
    .filter((snack) => snack.hours.openNow !== false);
}

async function loadSnacks(getOrigin: () => Promise<Position>, label: string): Promise<void> {
  snacksLoaded = false;
  snackList.replaceChildren();
  statusLine.textContent = "Looking for snacks…";
  try {
    const origin = await getOrigin();
    locationLabel.textContent = label;
    snacks = await openSnacksNear(origin);
    snacksLoaded = true;
    renderSnacks();
  } catch (error) {
    statusLine.textContent = error instanceof Error ? error.message : "Something went wrong.";
  }
}

function currentPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      () => reject(new Error("Couldn't get your location. Type a place above.")),
    );
  });
}

cravingChips.append(
  ...[SURPRISE_ME, ...CRAVINGS].map((label) => {
    const button = element("button", "", label) as HTMLButtonElement;
    button.type = "button";
    button.addEventListener("click", () => {
      craving = label === SURPRISE_ME ? null : (label as Craving);
      renderCravingChips();
      renderSnacks();
    });
    return button;
  }),
);
[priceSelect, sortSelect].forEach((control) => control.addEventListener("change", renderSnacks));
placeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const search = placeInput.value.trim();
  if (search) void loadSnacks(() => findPosition(search), search);
});

renderCravingChips();
void loadSnacks(currentPosition, "Your location");
