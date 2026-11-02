import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlaces, findPosition } from "./places";

const ORIGIN = { lat: 40.6568, lon: -74.0077 };

function stubFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchPlaces", () => {
  it("returns the places found", async () => {
    stubFetch({ elements: [{ lat: 1, lon: 2, tags: { name: "Cafe" } }] });
    expect((await fetchPlaces(ORIGIN))[0].name).toBe("Cafe");
  });

  it("searches around the origin", async () => {
    stubFetch({ elements: [] });
    await fetchPlaces(ORIGIN);
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(request?.body)).toContain(encodeURIComponent("around:800,40.6568,-74.0077"));
  });

  it("uses a node's position, or a building's center", async () => {
    stubFetch({
      elements: [
        { lat: 1, lon: 2, tags: { name: "Node" } },
        { center: { lat: 3, lon: 4 }, tags: { name: "Building" } },
      ],
    });
    const places = await fetchPlaces(ORIGIN);
    expect(places.map(({ name, lat, lon }) => [name, lat, lon])).toEqual([
      ["Node", 1, 2],
      ["Building", 3, 4],
    ]);
  });

  it("drops places with no name or position", async () => {
    stubFetch({ elements: [{ lat: 1, lon: 2, tags: {} }, { tags: { name: "Nowhere" } }] });
    expect(await fetchPlaces(ORIGIN)).toEqual([]);
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
