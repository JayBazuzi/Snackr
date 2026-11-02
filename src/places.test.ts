import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlaces, findPosition, overpassQuery, toPlaces } from "./places";

const ORIGIN = { lat: 40.6568, lon: -74.0077 };

function stubFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("overpassQuery", () => {
  it("searches around the origin", () => {
    expect(overpassQuery(ORIGIN)).toContain("around:800,40.6568,-74.0077");
  });
});

describe("toPlaces", () => {
  it("uses a node's position, or a building's center", () => {
    const places = toPlaces([
      { lat: 1, lon: 2, tags: { name: "Node" } },
      { center: { lat: 3, lon: 4 }, tags: { name: "Building" } },
    ]);
    expect(places.map(({ name, lat, lon }) => [name, lat, lon])).toEqual([
      ["Node", 1, 2],
      ["Building", 3, 4],
    ]);
  });

  it("drops places with no name or position", () => {
    expect(toPlaces([{ lat: 1, lon: 2, tags: {} }, { tags: { name: "Nowhere" } }])).toEqual([]);
  });
});

describe("fetchPlaces", () => {
  it("returns the places found", async () => {
    stubFetch({ elements: [{ lat: 1, lon: 2, tags: { name: "Cafe" } }] });
    expect((await fetchPlaces(ORIGIN))[0].name).toBe("Cafe");
  });

  it("falls back to the next server when one fails", async () => {
    const cafe = new Response(JSON.stringify({ elements: [{ lat: 1, lon: 2, tags: { name: "Cafe" } }] }));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("", { status: 502 }))
        .mockResolvedValueOnce(cafe),
    );
    expect((await fetchPlaces(ORIGIN))[0].name).toBe("Cafe");
  });

  it("reports when every server fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch({}, 429);
    await expect(fetchPlaces(ORIGIN)).rejects.toThrow("busy");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe("findPosition", () => {
  it("returns the first match", async () => {
    stubFetch([{ lat: "40.5", lon: "-74.5" }]);
    expect(await findPosition("Brooklyn")).toEqual({ lat: 40.5, lon: -74.5 });
  });

  it("reports no match", async () => {
    stubFetch([]);
    await expect(findPosition("Nowhere")).rejects.toThrow("Nowhere");
  });
});
