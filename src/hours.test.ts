import { describe, expect, it } from "vitest";
import { describeHours } from "./hours";

const MONDAY_5PM = new Date(2026, 10, 2, 17, 0);

describe("describeHours", () => {
  it("shows when an open place closes", () => {
    expect(describeHours("Mo-Su 10:00-18:00", MONDAY_5PM)).toEqual({ openNow: true, label: "Open until 6 PM" });
  });

  it("keeps minutes when the closing time has them", () => {
    expect(describeHours("Mo-Su 10:00-19:30", MONDAY_5PM).label).toBe("Open until 7:30 PM");
  });

  it("marks closed places", () => {
    expect(describeHours("Tu-Th 13:00-19:00", MONDAY_5PM)).toEqual({ openNow: false, label: "Closed now" });
  });

  it("shows places that never close", () => {
    expect(describeHours("24/7", MONDAY_5PM)).toEqual({ openNow: true, label: "Open 24 hours" });
  });

  it.each([undefined, "ask at the counter"])("treats %j as not listed", (value) => {
    expect(describeHours(value, MONDAY_5PM)).toEqual({ openNow: null, label: "Hours not listed" });
  });
});
