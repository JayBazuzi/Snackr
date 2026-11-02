import { describe, expect, it } from "vitest";
import { chooseSnacks, MAX_SNACKS, snackFor, walkMinutesBetween, type Place, type Snack } from "./snacks";

const ORIGIN = { lat: 40.6568, lon: -74.0077 };

function place(tags: Record<string, string>, offset = 0): Place {
  return { name: "Test place", lat: ORIGIN.lat + offset, lon: ORIGIN.lon, tags };
}

function snack(tags: Record<string, string>, offset = 0): Snack {
  const result = snackFor(place(tags, offset), ORIGIN);
  if (!result) throw new Error("expected a snack");
  return result;
}

describe("snackFor", () => {
  it.each([
    [{ amenity: "ice_cream" }, "Cold"],
    [{ shop: "chocolate" }, "Sweet"],
    [{ shop: "bakery" }, "Sweet"],
    [{ shop: "greengrocer" }, "Fresh"],
    [{ shop: "convenience" }, "Salty"],
    [{ amenity: "fast_food", cuisine: "pizza" }, "Savory"],
    [{ amenity: "restaurant", cuisine: "american;ramen" }, "Savory"],
  ])("turns %j into a %s snack", (tags, craving) => {
    expect(snackFor(place(tags), ORIGIN)?.craving).toBe(craving);
  });

  it("skips places no rule understands", () => {
    expect(snackFor(place({ amenity: "restaurant", cuisine: "fine_dining" }), ORIGIN)).toBeNull();
  });
});

describe("walkMinutesBetween", () => {
  it("is at least one minute", () => {
    expect(walkMinutesBetween(ORIGIN, ORIGIN)).toBe(1);
  });

  it("estimates about 16 minutes for a kilometer", () => {
    expect(walkMinutesBetween(ORIGIN, { lat: ORIGIN.lat + 0.009, lon: ORIGIN.lon })).toBe(16);
  });
});

describe("chooseSnacks", () => {
  const chocolate = snack({ shop: "chocolate" }, 0.001);
  const bakery = snack({ shop: "bakery" }, 0.002);
  const pizza = snack({ cuisine: "pizza" }, 0.003);
  const ramen = snack({ cuisine: "ramen" }, 0.0005);
  const all = [chocolate, bakery, pizza, ramen];

  it("filters by craving and price", () => {
    expect(chooseSnacks(all, { craving: "Sweet", price: null, sort: "closest" })).toEqual([chocolate, bakery]);
    expect(chooseSnacks(all, { craving: null, price: 3, sort: "closest" })).toEqual([ramen]);
  });

  it("sorts closest first, or cheapest first", () => {
    expect(chooseSnacks(all, { craving: null, price: null, sort: "closest" })[0]).toEqual(ramen);
    expect(chooseSnacks(all, { craving: null, price: null, sort: "cheapest" })[0]).toEqual(bakery);
  });

  it("keeps a surprise list varied when one craving is closest", () => {
    const manySweets = Array.from({ length: 12 }, (_, index) => snack({ shop: "bakery" }, index * 0.0001));
    const chosen = chooseSnacks([...manySweets, pizza], { craving: null, price: null, sort: "closest" });
    expect(chosen).toHaveLength(MAX_SNACKS);
    expect(chosen).toContainEqual(pizza);
  });
});
