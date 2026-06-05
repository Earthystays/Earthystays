import type { Destination } from "@/lib/types";

/**
 * Destinations are now STATES. Each state has a list of cities.
 * URL structure:
 *   /locations                    → list of states
 *   /locations/[state-slug]       → state page (cities + all villas in state)
 *   /locations/[state]/[city]     → city page (villas in that city)
 *
 * Villa.destinationSlug stores the STATE slug.
 * Villa.city stores the city display name (slug derived via slugify()).
 */
export const destinations: Destination[] = [
  {
    slug: "goa",
    name: "Goa",
    region: "West India",
    blurb: "Beachfront sundowners, Portuguese villas, palm-fringed pools.",
    description:
      "From quiet northern coves to the buzz of the southern beaches, our Goa villas pair coastal calm with the state's signature easy hospitality. Wake to coconut groves, swim before breakfast, dine on freshly grilled fish under the stars.",
    image: {
      src: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80",
      alt: "Coastal villa with private pool in Goa",
    },
    cities: [
      {
        slug: "north-goa",
        name: "North Goa",
        blurb: "Anjuna, Vagator, Assagao — buzzy beaches, cafe-lined lanes.",
        image: {
          src: "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=1600&q=80",
          alt: "Cliffside pool in North Goa",
        },
      },
      {
        slug: "south-goa",
        name: "South Goa",
        blurb: "Palolem, Cavelossim — quieter sands, longer mornings.",
        image: {
          src: "https://images.unsplash.com/photo-1505881502353-a1986add3762?auto=format&fit=crop&w=1600&q=80",
          alt: "Quiet beach in South Goa",
        },
      },
    ],
  },
  {
    slug: "maharashtra",
    name: "Maharashtra",
    region: "West India",
    blurb: "Sahyadri hill homes and harbour-side villas, all near Mumbai.",
    description:
      "From the misty Sahyadri plateau above Lonavala to the casuarina coast of Alibaug, Maharashtra's villas are built for the weekend escape — a couple of hours from the city, a world away in feel.",
    image: {
      src: "https://images.unsplash.com/photo-1518302057166-c990a3585cc3?auto=format&fit=crop&w=1600&q=80",
      alt: "Hillside villa overlooking the Sahyadri range",
    },
    cities: [
      {
        slug: "lonavala",
        name: "Lonavala",
        blurb: "Misty plateau, infinity pools, monsoon waterfalls.",
        image: {
          src: "https://images.unsplash.com/photo-1518302057166-c990a3585cc3?auto=format&fit=crop&w=1600&q=80",
          alt: "Hilltop villa overlooking the Sahyadri range",
        },
      },
      {
        slug: "alibaug",
        name: "Alibaug",
        blurb: "Beach boltholes across the harbour from Mumbai.",
        image: {
          src: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80",
          alt: "Coastal villa with pool in Alibaug",
        },
      },
    ],
  },
  {
    slug: "rajasthan",
    name: "Rajasthan",
    region: "North India",
    blurb: "Heritage havelis, palace views, hand-carved jharokhas.",
    description:
      "Stay where royalty once did. Rajasthan villas range from restored haveli courtyards in Udaipur to fort-side homes elsewhere — all within reach of the state's soft evening light and slow rhythms.",
    image: {
      src: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80",
      alt: "Heritage haveli with courtyard in Udaipur",
    },
    cities: [
      {
        slug: "udaipur",
        name: "Udaipur",
        blurb: "Lakeside heritage homes with City Palace views.",
        image: {
          src: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80",
          alt: "Heritage haveli with courtyard in Udaipur",
        },
      },
    ],
  },
  {
    slug: "karnataka",
    name: "Karnataka",
    region: "South India",
    blurb: "Coffee estates, river streams, cardamom-scented air.",
    description:
      "Karnataka's villa country sits in the Western Ghats — Coorg's plantations, Chikmagalur's mist. Estate-style stays with trails through the coffee, chefs who cook the Kodava classics, and birdsong instead of traffic.",
    image: {
      src: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1600&q=80",
      alt: "Coffee estate villa in Coorg",
    },
    cities: [
      {
        slug: "coorg",
        name: "Coorg",
        blurb: "Working coffee estates, walking trails, mountain rivers.",
        image: {
          src: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1600&q=80",
          alt: "Coffee estate in Coorg",
        },
      },
    ],
  },
  {
    slug: "himachal-pradesh",
    name: "Himachal Pradesh",
    region: "Himalayas",
    blurb: "Pine cabins, snow-capped views, mountain-river quiet.",
    description:
      "Above the apple orchards of Old Manali, our cabins lean into the cold — log fires, wool throws, plate-glass windows onto the Beas valley and the high snows beyond.",
    image: {
      src: "https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&w=1600&q=80",
      alt: "Wooden cabin in the Himalayas near Manali",
    },
    cities: [
      {
        slug: "manali",
        name: "Manali",
        blurb: "Deodar groves, valley views, fireplaces.",
        image: {
          src: "https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&w=1600&q=80",
          alt: "Cabin in the deodars near Manali",
        },
      },
    ],
  },
];

export function getStateBySlug(slug: string) {
  return destinations.find((d) => d.slug === slug);
}

export function getCityInState(stateSlug: string, citySlug: string) {
  const state = getStateBySlug(stateSlug);
  if (!state) return undefined;
  const city = state.cities.find((c) => c.slug === citySlug);
  if (!city) return undefined;
  return { state, city };
}
