import OpeningHours from "opening_hours";

export interface Hours {
  openNow: boolean | null;
  label: string;
}

const NOT_LISTED: Hours = { openNow: null, label: "Hours not listed" };

function clockTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(":00", "");
}

function parseHours(value: string): OpeningHours | null {
  try {
    return new OpeningHours(value);
  } catch {
    return null; // OpenStreetMap hours are hand-written, and some don't parse.
  }
}

function openLabel(hours: OpeningHours, now: Date): string {
  const closing = hours.getNextChange(now);
  return closing ? `Open until ${clockTime(closing)}` : "Open 24 hours";
}

export function describeHours(value: string | undefined, now: Date): Hours {
  const hours = value ? parseHours(value) : null;
  if (!hours || hours.getUnknown(now)) return NOT_LISTED;
  return hours.getState(now)
    ? { openNow: true, label: openLabel(hours, now) }
    : { openNow: false, label: "Closed now" };
}
