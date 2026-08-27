/**
 * Client-safe image constants.
 *
 * Deliberately free of any `fs`-backed import: this is consumed by client
 * components (VillaCard, VillaListItem), and pulling it from
 * `@/lib/data/villas` would drag Node's `fs` into the browser bundle.
 */

/**
 * Number of images a property card can actually display. PhotoCarousel
 * slices to `maxImages` (default 5) and callers don't override it, so
 * anything beyond this is never rendered — sending more only bloats the
 * RSC payload.
 */
export const CARD_IMAGE_COUNT = 5;
