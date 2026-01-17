const { sin, cos, sqrt, PI: π, atan2 } = Math;

const R = 6371; // radius of the earth in km
const K = π / 180; // marginal performance boost by pre-calculating this

/** deg to rad */
const ᐤ = (deg: number) => deg * K;

/** returns the distance in metres between two coordinates */
export function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ᐤ(lat2 - lat1);
  const dLon = ᐤ(lng2 - lng1);
  const a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(ᐤ(lat1)) * cos(ᐤ(lat2)) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return 1000 * R * c;
}

// higher values will make the script faster, but causes more
// false-positives for roads that cross a boundary
const SCALE = 0.7;

/**
 * for performance reasons, we split the datasets into "sectors" and
 * process each sector at a time.
 */
export function getSector(lat: number, lng: number): number {
  // the mainland spans 14 degrees of longitude (166-180) and 14 degrees of latitude (-34 to -48)
  // so we create 14*SCALE rows (numbers) and 14*SCALE columns (letters)
  // this means there'll be (14*SCALE)^2 sectors
  const column = Math.round(SCALE * (lng - 166));
  const row = Math.round(SCALE * (-34 - lat));
  return column * row;
}

export function getNameCode(name: string) {
  return name
    .toLowerCase()
    .replace(/saint /, "st ")
    .replace(/mount /, "mt ")
    .replace(/number /, "no ")
    .replace(/[^A-Za-z0-9āēīōū]/g, "");
}

const abbrLookup: Record<string, string> = {
  ALY: "Alley",
  AVE: "Avenue",
  BAY: "Bay",
  BLVD: "Boulevard",
  CIR: "Circle",
  COR: "Corner",
  CRES: "Crescent",
  CRK: "Creek",
  CT: "Court",
  CTR: "Center",
  CV: "Cove",
  CYN: "Canyon",
  DR: "Drive",
  EST: "Estate",
  ESTS: "Estates",
  EXPY: "Expressway",
  FLT: "Flat",
  FRK: "Fork",
  FWY: "Freeway",
  GLN: "Glen",
  GRV: "Grove",
  GTWY: "Gateway",
  HL: "Hill",
  HOLW: "Hollow",
  HTS: "Heights",
  HWY: "Highway",
  JCT: "Junction",
  LN: "Lane",
  LNDG: "Landing",
  LOOP: "Loop",
  MDW: "Meadow",
  MDWS: "Meadows",
  MNR: "Manor",
  PARK: "Park",
  PASS: "Pass",
  PATH: "Path",
  PKWY: "Parkway",
  PL: "Place",
  PLZ: "Plaza",
  PT: "Point",
  RD: "Road",
  RDG: "Ridge",
  RNCH: "Ranch",
  ROW: "Row",
  RTE: "Route",
  RUN: "Run",
  SPUR: "Spur",
  SQ: "Square",
  ST: "Street",
  TER: "Terrace",
  TRCE: "Trace",
  TRL: "Trail",
  VIS: "Vista",
  VLG: "Village",
  VW: "View",
  WAY: "Way",
  XING: "Crossing",
  S: "South",
  N: "North",
  E: "East",
  W: "West",
};

export function normalizeStreetName(rawName: string): string {
  const words = rawName.split(/\s+/).map((w) => w.trim());
  const expanded = words.map((w) => {
    const upper = w.toUpperCase();
    return abbrLookup[upper] || w.toLowerCase();
  });
  return expanded.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
