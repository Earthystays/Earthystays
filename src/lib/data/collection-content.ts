/**
 * Per-collection SEO intro copy for /collections/[slug] pages. Kept
 * separate from the Collection data model (name/blurb/image) since this is
 * long-form on-page + meta content, not something admins manage via the
 * collections CRUD — these pages were indexed as thin content (filter UI +
 * a card grid, no body copy) until this was added.
 */
type CollectionSeoContent = {
  title: string;
  description: string;
  heading: string;
  intro: string;
};

const CONTENT: Record<string, CollectionSeoContent> = {
  "pool-villas": {
    title: "Private Pool Villas in India",
    description:
      "Handpicked villas with private pools across Goa, Maharashtra, Rajasthan and beyond — infinity edges, plunge pools, and full staff to keep them spotless.",
    heading: "Private pool villas across India",
    intro:
      "A private pool changes the shape of a trip — mornings become laps before breakfast, afternoons become nothing at all. Every villa in this collection comes with its own pool, not a shared one, so it's yours for the length of your stay. We've handpicked these across Goa, Maharashtra, Rajasthan, Karnataka, and Himachal Pradesh, from sea-facing infinity edges to quiet plunge pools tucked into a courtyard.",
  },
  "pet-friendly": {
    title: "Pet-Friendly Villas in India | Bring Your Dog",
    description:
      "Villas that genuinely welcome pets — fenced gardens, no size restrictions, and hosts who mean it when they say your dog is welcome too.",
    heading: "Pet-friendly villas, no compromises",
    intro:
      "Most \"pet-friendly\" listings mean small dogs only, or a hefty extra fee at check-in. These don't. Every villa in this collection has an owner who has explicitly confirmed pets are welcome — often with a garden or open compound your dog can actually run in. Available across our destinations in Goa, Maharashtra, Rajasthan, Karnataka, and Himachal Pradesh.",
  },
  beachfront: {
    title: "Beachfront Villas in India | Steps from the Sand",
    description:
      "Villas where the beach is the front lawn — short walks or direct sand access across Goa's coastline and beyond.",
    heading: "Beachfront villas — sand at the door",
    intro:
      "There's beachfront, and then there's beach-adjacent-with-a-view. This collection is the real thing: villas where you can walk out and be on the sand in under a couple of minutes, mostly concentrated along Goa's coast. Wake up to the sound of the waves and skip the beach-bag logistics entirely.",
  },
  "weekend-escapes": {
    title: "Weekend Getaway Villas Near India's Major Cities",
    description:
      "Short-drive villas for a proper weekend off — under two hours from major cities, no flights required.",
    heading: "Weekend escapes, no flight required",
    intro:
      "Sometimes the best trip is the one you don't need to plan a week around. Every villa in this collection is within an easy drive of a major city — think Lonavala and Alibaug from Mumbai and Pune, or the hills of Himachal from Delhi — so a long weekend is genuinely enough time to make it worth the trip.",
  },
  "for-large-groups": {
    title: "Large Group Villas in India | Sleeps 12+",
    description:
      "Big villas for big groups — reunions, milestone birthdays, and destination celebrations that need real space for 12 or more.",
    heading: "Villas built for a crowd",
    intro:
      "Splitting a big group across two or three smaller places never quite works — someone's always in a different building for breakfast. These villas sleep 12 or more under one roof, with the shared living space, dining tables, and staff support to actually host a group that size, not just accommodate it.",
  },
};

const DEFAULT_CONTENT = (name: string, blurb: string): CollectionSeoContent => ({
  title: name,
  description: blurb,
  heading: name,
  intro: blurb,
});

export function getCollectionSeoContent(
  slug: string,
  fallbackName: string,
  fallbackBlurb: string,
): CollectionSeoContent {
  return CONTENT[slug] ?? DEFAULT_CONTENT(fallbackName, fallbackBlurb);
}
