import type { Experience } from "@/lib/types";
import { readJsonSync } from "@/lib/storage";

const SEED: Experience[] = [
  {
    slug: "yacht-charters",
    name: "Yacht Charters",
    blurb:
      "Private sunset cruises, celebrations, and luxury experiences at sea.",
    image: {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
      alt: "Luxury yacht cruising at sunset",
    },
    hero: {
      title: "Luxury Yacht Charters in Goa",
      description:
        "Take to the Arabian Sea on a private yacht — for sundowners, intimate celebrations, or simply a quieter way to see the coast.",
    },
    overview:
      "Explore Goa's coastline aboard a private luxury yacht — perfect for celebrations, proposals, sunset cruises, and special occasions. Our fleet is fully staffed with a captain, deckhand, and dedicated host so the only thing you do is show up and enjoy the water.",
    perfectFor: [
      "Birthday Celebrations",
      "Anniversaries",
      "Proposals",
      "Bachelor Parties",
      "Family Gatherings",
      "Corporate Events",
    ],
    whatsIncluded: [
      {
        title: "Professional Coordination",
        description:
          "Dedicated concierge plans the route, timing, and onboard service.",
        icon: "Sparkles",
      },
      {
        title: "Customizable Packages",
        description:
          "Music, decor, photographer, or live counter — built around your occasion.",
        icon: "Settings2",
      },
      {
        title: "Local Expertise",
        description:
          "Captains who know the coast — best coves, sundown spots, calm waters.",
        icon: "MapPin",
      },
      {
        title: "Concierge Support",
        description:
          "On-call from booking through disembarkation — anything you need.",
        icon: "Headphones",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
        alt: "Yacht deck at golden hour",
      },
      {
        src: "https://images.unsplash.com/photo-1599582909646-6c80e84c3cbb?auto=format&fit=crop&w=1200&q=80",
        alt: "Champagne and snacks served on deck",
      },
      {
        src: "https://images.unsplash.com/photo-1527824404775-dce343118ebc?auto=format&fit=crop&w=1200&q=80",
        alt: "Guests relaxing on the bow",
      },
      {
        src: "https://images.unsplash.com/photo-1500627964684-141351970a7f?auto=format&fit=crop&w=1200&q=80",
        alt: "Yacht silhouetted against a sunset",
      },
    ],
    faqs: [
      {
        question: "Can yacht charters be booked without a villa stay?",
        answer:
          "Yes, but villa guests get priority and a curated package rate. Tell our concierge your dates either way.",
      },
      {
        question: "How far in advance should I book?",
        answer:
          "Ideally 5–7 days for weekday cruises and 10+ days for weekends or holiday weeks. Last-minute requests are handled on a best-effort basis.",
      },
      {
        question: "Which routes are available?",
        answer:
          "Most charters operate from Mandovi or the south-Goa marinas. Standard routes cover Aguada, the islands, and sunset stretches off Sinquerim.",
      },
    ],
  },
  {
    slug: "private-chef",
    name: "Private Chef",
    blurb:
      "Curated dining experiences prepared in the comfort of your villa.",
    image: {
      src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
      alt: "Chef plating a refined dish at a villa",
    },
    hero: {
      title: "Private Chef Experiences",
      description:
        "Coastal Goan, Italian, Asian, or seafood-forward — a private chef who plans the menu around your group and cooks in your villa kitchen.",
    },
    overview:
      "Skip the restaurant. We bring a hand-picked private chef to your villa for breakfast, a long lunch, or a multi-course tasting dinner. Menus are planned around dietary preferences, occasion, and the season — and the kitchen is left spotless on the way out.",
    perfectFor: [
      "Romantic Dinners",
      "Birthday Celebrations",
      "Anniversaries",
      "Family Brunches",
      "Bachelor / Bachelorette Parties",
      "Corporate Hosting",
    ],
    whatsIncluded: [
      {
        title: "Custom Menu Planning",
        description:
          "Tasting menu, à la carte, or grazing — your chef plans around the table.",
        icon: "ChefHat",
      },
      {
        title: "Premium Ingredients",
        description:
          "Fresh seafood, farm produce, and curated wine pairings on request.",
        icon: "Wheat",
      },
      {
        title: "Service Staff",
        description:
          "Server, sommelier-style host, and post-meal cleanup as needed.",
        icon: "UtensilsCrossed",
      },
      {
        title: "Concierge Support",
        description:
          "Allergens, kid-friendly courses, or that one missing ingredient — handled.",
        icon: "Headphones",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80",
        alt: "Chef plating dinner",
      },
      {
        src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=80",
        alt: "Elegant table set for service",
      },
      {
        src: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1200&q=80",
        alt: "Open kitchen prep",
      },
      {
        src: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1200&q=80",
        alt: "Fresh produce being prepped",
      },
    ],
    faqs: [
      {
        question: "Can I request a specific cuisine?",
        answer:
          "Yes — Goan, North Indian, Italian, Pan-Asian, Continental, or pescetarian/vegetarian-only menus are all available.",
      },
      {
        question: "Do you handle allergies and dietary restrictions?",
        answer:
          "Always. Share details when you inquire and the chef plans around it from the menu draft onward.",
      },
      {
        question: "Is alcohol included?",
        answer:
          "Alcohol isn't included by default, but we can arrange a curated bar with a sommelier-style host on request.",
      },
    ],
  },
  {
    slug: "celebrations-and-decor",
    name: "Celebrations & Decor",
    blurb:
      "Birthday setups, anniversaries, proposals, and special occasions.",
    image: {
      src: "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=1600&q=80",
      alt: "Candlelit anniversary setup at a villa",
    },
    hero: {
      title: "Celebrations & Decor",
      description:
        "From a quiet candlelit proposal to a full poolside birthday — we handle the styling, lighting, florals, and surprises.",
    },
    overview:
      "Whether it's a milestone birthday, a long-awaited anniversary, or a private proposal, our in-house stylists set the mood end-to-end. Florals, lighting, table linen, signage, balloon installations, photographer, even the cake — coordinated to the minute.",
    perfectFor: [
      "Birthday Celebrations",
      "Anniversaries",
      "Proposals",
      "Baby Showers",
      "Surprise Reveals",
      "Bachelor / Bachelorette Parties",
    ],
    whatsIncluded: [
      {
        title: "Theme & Mood Boarding",
        description:
          "We send you a board before locking colors, florals, and lighting.",
        icon: "Sparkles",
      },
      {
        title: "Setup & Teardown",
        description:
          "Crew arrives during your dinner or excursion — you walk back into it.",
        icon: "Settings2",
      },
      {
        title: "Premium Florals",
        description:
          "Fresh sourcing — roses, orchids, native flora — never plastic.",
        icon: "Flower",
      },
      {
        title: "Photographer on Standby",
        description:
          "Optional add-on so the reveal is captured the moment it happens.",
        icon: "Camera",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=1200&q=80",
        alt: "Candlelit anniversary table",
      },
      {
        src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
        alt: "Birthday balloons and decor",
      },
      {
        src: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
        alt: "Proposal setup on the lawn",
      },
      {
        src: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=1200&q=80",
        alt: "Floral installation by the pool",
      },
    ],
    faqs: [
      {
        question: "How early do I need to book?",
        answer:
          "5–7 days for standard setups; 10+ for elaborate florals or surprise reveals. Last-minute requests are accommodated where possible.",
      },
      {
        question: "Can you keep it a surprise?",
        answer:
          "Absolutely — we coordinate with the booking guest discreetly so the surprise stays a surprise.",
      },
      {
        question: "Do you provide the cake?",
        answer:
          "Yes, partner bakeries deliver the cake. We can also coordinate dietary-specific options (eggless, vegan, gluten-free).",
      },
    ],
  },
  {
    slug: "airport-transfers",
    name: "Airport Transfers",
    blurb: "Comfortable and reliable transfers to and from your stay.",
    image: {
      src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
      alt: "Luxury sedan on a coastal road",
    },
    hero: {
      title: "Premium Airport Transfers",
      description:
        "Late-night arrival, early flight out, or a weekend convoy — your transfer is staffed, tracked, and on time.",
    },
    overview:
      "Skip the queue. We arrange premium sedan or SUV transfers from both Goa airports (Dabolim and Mopa) to your villa, with chauffeurs who handle the bags and a coordinator tracking the flight so you're never waiting alone.",
    perfectFor: [
      "Late-night Arrivals",
      "Group Pickups",
      "Multi-City Convoys",
      "Corporate Guests",
      "Wedding Parties",
      "Long-Stay Guests",
    ],
    whatsIncluded: [
      {
        title: "Flight Tracking",
        description:
          "Real-time monitoring — driver shifts if your flight delays.",
        icon: "PlaneLanding",
      },
      {
        title: "Premium Vehicles",
        description:
          "Sedans, SUVs, and tempo travellers — all serviced and insured.",
        icon: "Car",
      },
      {
        title: "Trained Chauffeurs",
        description:
          "Uniformed, English-speaking, and familiar with every villa lane.",
        icon: "UserCheck",
      },
      {
        title: "On-Call Coordination",
        description:
          "One WhatsApp line for the driver, the dispatcher, and the concierge.",
        icon: "Headphones",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        alt: "Luxury sedan on the highway",
      },
      {
        src: "https://images.unsplash.com/photo-1485395037613-e83d5c1f5290?auto=format&fit=crop&w=1200&q=80",
        alt: "Driver greeting arrivals",
      },
      {
        src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
        alt: "Cabin interior of an SUV",
      },
    ],
    faqs: [
      {
        question: "Do you cover both Goa airports?",
        answer:
          "Yes — Dabolim (south) and Mopa (north). The vehicle and route are matched to your villa's location.",
      },
      {
        question: "Can I share a vehicle for a group?",
        answer:
          "Of course — share guest count, luggage, and pickup window and we'll right-size the vehicle.",
      },
      {
        question: "What if my flight changes?",
        answer:
          "Tell us through the dispatcher line and we'll re-time the driver. No extra charge for delays.",
      },
    ],
  },
  {
    slug: "adventure-activities",
    name: "Adventure Activities",
    blurb:
      "Scuba diving, parasailing, watersports, and island adventures.",
    image: {
      src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80",
      alt: "Scuba diver exploring tropical waters",
    },
    hero: {
      title: "Adventure & Watersports",
      description:
        "Beyond the beach loungers — vetted operators for diving, parasailing, jet skis, and island day trips.",
    },
    overview:
      "We work with a tight roster of safety-first operators for adventure activities — so you book once and we handle vetting, timing, and pickup. From a first scuba experience at Grande Island to parasailing off Calangute, we cover the planning end-to-end.",
    perfectFor: [
      "Adventure Seekers",
      "Bachelor / Bachelorette Trips",
      "Family Holidays",
      "Friends Groups",
      "Photo & Video Shoots",
      "Corporate Offsites",
    ],
    whatsIncluded: [
      {
        title: "Vetted Operators",
        description:
          "Only partners with current safety certifications and insurance.",
        icon: "ShieldCheck",
      },
      {
        title: "Curated Combos",
        description:
          "Pair watersports + lunch + transport into a single half- or full-day plan.",
        icon: "CalendarRange",
      },
      {
        title: "Transport Included",
        description:
          "Pickup from your villa to the activity point and back.",
        icon: "Car",
      },
      {
        title: "On-Call Concierge",
        description:
          "Reschedule for weather, swap activities, add guests — one line.",
        icon: "Headphones",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80",
        alt: "Scuba diving",
      },
      {
        src: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=1200&q=80",
        alt: "Parasailing over a turquoise bay",
      },
      {
        src: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=1200&q=80",
        alt: "Jet skis on the water",
      },
    ],
    faqs: [
      {
        question: "Are all activities safe for beginners?",
        answer:
          "Most are — diving has a discovery tier for first-timers, and parasailing/jet skis are guided. Share the group's experience and we'll match.",
      },
      {
        question: "Are kids allowed?",
        answer:
          "Most operators have age + height minimums. Tell us the ages when you inquire and we'll filter to suitable options.",
      },
      {
        question: "What happens in bad weather?",
        answer:
          "Activities reschedule or refund — we won't run anything the operator's safety check doesn't clear.",
      },
    ],
  },
  {
    slug: "car-and-scooter-rentals",
    name: "Car & Scooter Rentals",
    blurb: "Explore Goa at your own pace.",
    image: {
      src: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=80",
      alt: "Scooter on a tree-lined road",
    },
    hero: {
      title: "Car & Scooter Rentals",
      description:
        "Beach hopping, café runs, or simply the freedom to wander. We deliver the vehicle to your villa.",
    },
    overview:
      "We arrange clean, well-serviced cars and scooters delivered straight to your villa — with all the paperwork, helmets, and a 24/7 support line if anything needs a swap.",
    perfectFor: [
      "Couples on Day Trips",
      "Friends Groups",
      "Beach Hopping",
      "Self-Guided Tours",
      "Long-Stay Guests",
      "Quick School-Run Errands",
    ],
    whatsIncluded: [
      {
        title: "Villa Delivery",
        description:
          "Vehicle dropped at your villa, picked up the day you leave.",
        icon: "Truck",
      },
      {
        title: "Serviced & Insured",
        description:
          "Recently serviced fleet, fully insured, helmets and fuel briefing.",
        icon: "ShieldCheck",
      },
      {
        title: "Flexible Duration",
        description:
          "Half-day, full-day, or week-long — extend on the fly via WhatsApp.",
        icon: "CalendarRange",
      },
      {
        title: "24×7 Support",
        description:
          "If anything's off, a replacement is on its way the same day.",
        icon: "Headphones",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
        alt: "Scooter parked on a country road",
      },
      {
        src: "https://images.unsplash.com/photo-1502786129293-79981df4e689?auto=format&fit=crop&w=1200&q=80",
        alt: "Vintage scooter by a Goan road",
      },
      {
        src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
        alt: "SUV interior on the highway",
      },
    ],
    faqs: [
      {
        question: "Do I need an Indian driving license?",
        answer:
          "Yes for cars. International Driving Permits work for scooters with a passport copy. We confirm the paperwork before delivery.",
      },
      {
        question: "What if the vehicle has an issue?",
        answer:
          "Message the support line — most issues get a same-day swap delivered to the villa.",
      },
      {
        question: "Is fuel included?",
        answer:
          "Pickup is full-to-full — we hand it over fuelled and you bring it back the same level.",
      },
    ],
  },
  {
    slug: "corporate-retreats",
    name: "Corporate Retreats",
    blurb: "Curated offsites and team getaways.",
    image: {
      src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80",
      alt: "Team gathered around a villa lawn meeting",
    },
    hero: {
      title: "Corporate Retreats & Offsites",
      description:
        "Strategy, team-building, or pure decompression — we plan the agenda, the meals, and the moments in between.",
    },
    overview:
      "Pick a villa, send us the brief, and we own the rest — agenda blocks, breakouts, breakfast through dinner, a facilitator if you want one, and downtime activities so the team actually unwinds.",
    perfectFor: [
      "Leadership Offsites",
      "Engineering Retreats",
      "Sales Kickoffs",
      "Founder Meetups",
      "Customer Advisory Boards",
      "Annual Planning",
    ],
    whatsIncluded: [
      {
        title: "End-to-End Planning",
        description:
          "Agenda blocks, A/V, breakouts, meals — one coordinator for it all.",
        icon: "ClipboardCheck",
      },
      {
        title: "Group Villa Stays",
        description:
          "Properties picked for sleeping capacity AND working capacity.",
        icon: "Building2",
      },
      {
        title: "Catering & F&B",
        description:
          "From breakfast to closing-night dinner — special diets handled.",
        icon: "ChefHat",
      },
      {
        title: "Team Activities",
        description:
          "Yacht charters, beach games, sunset cruises — built into the agenda.",
        icon: "Users",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
        alt: "Team brainstorm on a villa lawn",
      },
      {
        src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
        alt: "Workshop session at a villa",
      },
      {
        src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
        alt: "Team lunch under string lights",
      },
    ],
    faqs: [
      {
        question: "What's the minimum group size?",
        answer:
          "We've planned retreats from 8 to 80. Smaller groups stay in a single villa; larger ones are split across adjacent properties.",
      },
      {
        question: "Do you handle vendor invoicing?",
        answer:
          "Yes — single consolidated invoice with GST. We can also split-bill across cost centers if needed.",
      },
      {
        question: "Can you provide a facilitator?",
        answer:
          "Yes — we partner with facilitators across strategy, OKR planning, and leadership development.",
      },
    ],
  },
  {
    slug: "custom-experiences",
    name: "Custom Experiences",
    blurb: "Tailored recommendations based on guest preferences.",
    image: {
      src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1600&q=80",
      alt: "Concierge planning a personalised itinerary",
    },
    hero: {
      title: "Custom Concierge Experiences",
      description:
        "If it isn't on the list — ask. We've built itineraries for everything from spice-farm dinners to private vineyard tours.",
    },
    overview:
      "Some of our favourite experiences started as a single line in an inquiry — \"can you arrange a private screening on the lawn?\", \"a sound bath at sunrise?\". Tell us what you have in mind and we'll build a quote.",
    perfectFor: [
      "Anniversary Surprises",
      "Family Reunions",
      "Hard-to-Buy-For Gifts",
      "Private Events",
      "Wellness Days",
      "Anything we haven't listed",
    ],
    whatsIncluded: [
      {
        title: "Discovery Call",
        description:
          "A short WhatsApp call to understand the brief in detail.",
        icon: "Headphones",
      },
      {
        title: "Curated Shortlist",
        description:
          "2–3 options with pricing, timing, and what's included in each.",
        icon: "ClipboardCheck",
      },
      {
        title: "End-to-End Coordination",
        description:
          "Vendor calls, contracts, logistics — managed for you.",
        icon: "Settings2",
      },
      {
        title: "On-Day Concierge",
        description:
          "A single point of contact on the day, in your time zone.",
        icon: "Sparkles",
      },
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80",
        alt: "Custom itinerary on a desk",
      },
      {
        src: "https://images.unsplash.com/photo-1505932049984-db8e2f5a02ed?auto=format&fit=crop&w=1200&q=80",
        alt: "Private outdoor screening",
      },
      {
        src: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1200&q=80",
        alt: "Wellness session in nature",
      },
    ],
    faqs: [
      {
        question: "Is there a minimum spend?",
        answer:
          "No, but very small budgets may limit options. We're upfront about what's achievable at each price point.",
      },
      {
        question: "How quickly do you respond?",
        answer:
          "Within a few hours, every day of the week — including the night before a stay.",
      },
      {
        question: "Can you book non-Goa experiences?",
        answer:
          "We're strongest in Goa. For other locations we partner with trusted regional concierges and stay in the loop.",
      },
    ],
  },
];

type AdminExperiences = {
  overrides?: Record<
    string,
    { name?: string; blurb?: string; image?: { src: string; alt: string } }
  >;
  added?: Experience[];
  deleted?: string[];
};

function loadAdminExperiences(): AdminExperiences {
  return readJsonSync<AdminExperiences>("admin-experiences.json", {});
}

export const experiences: Experience[] = SEED;

export function getAllExperiences(): Experience[] {
  const admin = loadAdminExperiences();
  const deleted = new Set(admin.deleted ?? []);
  const out: Experience[] = [];

  for (const e of SEED) {
    if (deleted.has(e.slug)) continue;
    const ov = admin.overrides?.[e.slug];
    out.push({
      ...e,
      name: ov?.name ?? e.name,
      blurb: ov?.blurb ?? e.blurb,
      image: ov?.image ?? e.image,
    });
  }
  for (const e of admin.added ?? []) {
    if (deleted.has(e.slug)) continue;
    if (SEED.some((s) => s.slug === e.slug)) continue;
    out.push(e);
  }
  return out;
}

export function getExperienceBySlug(slug: string) {
  return getAllExperiences().find((e) => e.slug === slug);
}

export function isSeedExperience(slug: string): boolean {
  return SEED.some((e) => e.slug === slug);
}
