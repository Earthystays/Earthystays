/**
 * Pull latitude/longitude out of whatever a host pastes — a plain
 * "lat, lng" pair, or a Google Maps URL in any of its many shapes.
 *
 * Deliberately dependency-free so it can run on both the client (instant
 * feedback while typing) and the server (resolving shortened share links).
 */

export type Coords = { lat: number; lng: number };

function inRange(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // 0,0 is almost always a parse artefact, not a real Goa villa.
    !(lat === 0 && lng === 0)
  );
}

/**
 * Try, in order, the patterns that carry real coordinates. Returns the first
 * plausible pair, or null when nothing usable is found (e.g. an unexpanded
 * `maps.app.goo.gl` short link, which the server resolves first).
 */
export function parseCoords(input: string): Coords | null {
  if (!input) return null;
  let text = input.trim();

  // Decode once so `%2C`-style encoded commas inside URLs match too.
  try {
    text = decodeURIComponent(text);
  } catch {
    // Malformed escape sequence — keep the raw text.
  }

  const candidates: Array<[number, number]> = [];
  const push = (a?: string, b?: string) => {
    if (a === undefined || b === undefined) return;
    candidates.push([parseFloat(a), parseFloat(b)]);
  };

  // 1. Place-data params, e.g. ...!3d15.5187!4d73.7629 (most precise: the pin).
  for (const m of text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)) {
    push(m[1], m[2]);
  }

  // 2. Query params that carry "lat,lng": q= query= ll= sll= center= destination=
  for (const m of text.matchAll(
    /[?&](?:q|query|ll|sll|center|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gi,
  )) {
    push(m[1], m[2]);
  }

  // 3. The @lat,lng viewport in a /maps/ URL.
  for (const m of text.matchAll(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
    push(m[1], m[2]);
  }

  // 4. A bare "lat, lng" pair (what right-click → copy on desktop gives).
  const bare = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(text);
  if (bare) push(bare[1], bare[2]);

  for (const [lat, lng] of candidates) {
    if (inRange(lat, lng)) return { lat, lng };
  }
  return null;
}

/** True for Google's shortened share links, which carry no coordinates
 *  until they're followed to their destination. */
export function isShortMapLink(input: string): boolean {
  return /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(input.trim());
}
