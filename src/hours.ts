import OpeningHours from "opening_hours";

export interface Hours {
  openNow: boolean | null;
  label: string;
}

const NOT_LISTED: Hours = { openNow: null, label: "Hours not listed" };

function clockTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(":00", "");
}

export function describeHours(value: string | undefined, now: Date): Hours {
  if (!value) return NOT_LISTED;
  try {
    const hours = new OpeningHours(value);
    if (hours.getUnknown(now)) return NOT_LISTED;
    const openNow = hours.getState(now);
    const change = hours.getNextChange(now);
    if (openNow) return { openNow, label: change ? `Open until ${clockTime(change)}` : "Open 24 hours" };
    return { openNow, label: "Closed now" };
  } catch {
    return NOT_LISTED; // OpenStreetMap hours are hand-written, and some don't parse.
  }
}
