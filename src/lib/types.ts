export type Image = {
  src: string;
  alt: string;
  tag?: string; // room label e.g. "Bedroom 1", "Kitchen", "Pool"
};

/** Loose alias — preset names are listed in VILLA_AMENITIES, and the admin
 *  is free to add custom amenities on top, so the runtime shape is just a
 *  free-form string. */
export type Amenity = string;

export type PropertyType = "villa" | "apartment" | "hotel" | "hostel";

/* ─────────────────────────────────────────────────────────────────────────
 * Accommodation units (Hotel + Hostel expansion — Phase A)
 *
 * A property optionally carries `units: AccommodationUnit[]`.
 *   • Villa / apartment  → no units. Renders exactly as before (whole-property).
 *   • Hotel              → units are ROOM TYPES ("Deluxe Room", "Premium Suite").
 *   • Hostel             → units are DORM TYPES ("8 Bed Mixed Dorm").
 *
 * Inventory model (inquiry-led v1): pooled `inventory` count is the source of
 * truth ("8 rooms available" / "8 beds available"). Named `beds` / `rooms` are
 * OPTIONAL and drive the bed-selection / room-list UI only — true atomic holds
 * & payment are a later, gated phase and deliberately not modelled here.
 * ───────────────────────────────────────────────────────────────────────── */

/** Room type (hotel) vs dorm type (hostel). */
export type UnitKind = "room" | "dorm";

/** Hostel dorm gender policy. */
export type DormGender = "mixed" | "female" | "male";

/** Operational status for a single named bed or room. Display/selection only
 *  in v1 — no atomic booking guarantee is implied. */
export type InventoryUnitStatus =
  | "available"
  | "held"
  | "booked"
  | "blocked"
  | "maintenance"
  | "out_of_service";

/** A single named bed inside a dorm (Bed 1…8). Optional — only present when a
 *  hostel opts into per-bed selection instead of auto-assignment. */
export type BedInventory = {
  id: string;
  /** Display label, e.g. "Bed 1". */
  label: string;
  position?: "upper" | "lower";
  status?: InventoryUnitStatus;
  notes?: string;
};

/** A single named physical room inside a hotel room type (Room 101…). Optional —
 *  only present when a hotel opts into room-level inventory over pooled. */
export type RoomInventory = {
  id: string;
  /** Room number / label, e.g. "101". */
  number: string;
  floor?: string;
  status?: InventoryUnitStatus;
  notes?: string;
};

/** A hotel room type or hostel dorm type belonging to a property. */
export type AccommodationUnit = {
  id: string;
  kind: UnitKind;
  name: string;
  shortDescription?: string;
  description?: string;

  /* Capacity */
  maxGuests: number;
  adults?: number;
  children?: number;
  /** Room/dorm size, free-form e.g. "250 sq ft". */
  size?: string;
  /** Bed configuration, e.g. "1 Queen Bed" or "8 Single Beds". */
  bedConfiguration?: string;

  /* Hostel-only */
  gender?: DormGender;
  bedCount?: number;

  /* Hotel-only */
  view?: string;
  balcony?: boolean;
  smokingAllowed?: boolean;

  /* Presentation */
  images?: Image[];
  amenities?: string[];

  /* Inventory (pooled — source of truth in v1) */
  inventory: number;
  /** When true, guests pick a specific bed/room; when false, auto-assign. */
  allowUnitSelection?: boolean;
  /** Optional named beds (dorm) — present only when selection is enabled. */
  beds?: BedInventory[];
  /** Optional named rooms (hotel) — present only when room-level inventory. */
  rooms?: RoomInventory[];

  /* Pricing (inquiry-led display; no live tax/commission engine in v1) */
  basePrice: number;
  weekendPrice?: number;
  extraGuestPrice?: number;
  childPrice?: number;
  taxPercent?: number;

  /* Stay rules */
  minNights?: number;
  maxNights?: number;
  mealPlan?: string;
  cancellationPolicy?: string;
};

/** A structured line item on an inquiry — lets a single inquiry capture
 *  "2× Deluxe Room" or "3 beds in 8 Bed Mixed Dorm". Optional & additive:
 *  villa inquiries simply omit it. */
export type BookingItem = {
  unitId: string;
  unitName: string;
  quantity: number;
  /** Per-night price of the chosen room/bed at inquiry time — snapshot so the
   *  guest and the admin both see the figure the guest was looking at. */
  unitPrice?: number;
  /** Specific bed/room ids when the guest selected them. */
  selectedInventoryIds?: string[];
};

/** Marketplace listing lifecycle. Legacy records with no status are
 *  team-managed and treated as approved. Nothing a host creates goes
 *  live until the Earthy Stays team approves it. */
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "hidden";

export type Villa = {
  slug: string;
  type?: PropertyType; // defaults to "villa" when missing
  name: string;
  tagline: string;
  description: string;
  destinationSlug: string;
  collections: string[];
  bedrooms: number;
  maxGuests: number;
  bathrooms: number;
  pricePerNight: number; // INR
  /** Hotel room types / hostel dorm types. Absent on villas & apartments —
   *  those render as a single whole-property listing exactly as before. */
  units?: AccommodationUnit[];
  rating: number;
  reviewCount: number;
  amenities: string[];
  facilities?: string[];
  highlights: string[];
  images: Image[];
  houseRules: string[];
  locationNote: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  /** Google Business Profile Place ID — enables Google review import. */
  googlePlaceId?: string;
  cancellationPolicy?: {
    preset?: "flexible" | "moderate" | "strict" | "custom";
    description?: string;
  };
  meals?: {
    preset?:
      | "self-catering"
      | "breakfast"
      | "all-meals"
      | "chef-included"
      | "chef-on-request"
      | "custom";
    description?: string;
  };
  video?: {
    kind: "youtube" | "vimeo" | "file";
    id?: string;       // youtube / vimeo video id
    src?: string;      // url for file uploads
    poster?: string;   // optional poster image
  };
  faqs?: Array<{ question: string; answer: string }>;
  externalListings?: Array<{
    platform: string; // "Airbnb" | "Booking.com" | "Google" | "Vrbo" | "TripAdvisor" | custom
    url: string;
    rating?: number; // 0–5
    reviewCount?: number;
  }>;
  /** Experience slugs assigned to this property — rendered as the
   *  "Enhance Your Stay" upsell section on the detail page. */
  experiences?: string[];
  featured?: boolean;
  /** 1 = first slot on the home page, 6 = last. Unset = appears after
   *  all ranked items (in load order). Capped at 6 displayed per type. */
  featuredRank?: number;
  /** Marketplace fields — absent on team-managed legacy records. */
  hostId?: string;
  status?: ListingStatus;
  /** Reviewer note shown to the host when status is "rejected". */
  rejectedReason?: string;
  minNights?: number;
  submittedAt?: string;
  /** Optional PDF brochure guests can view/download from the listing page. */
  brochure?: {
    url: string;
    fileName: string;
    uploadedAt: string;
  };
};

export type LocationArea = {
  slug: string;
  name: string;
};

export type City = {
  slug: string;
  name: string;
  blurb: string;
  image: Image;
  /** Optional list of localities / neighbourhoods inside this city
   *  (e.g. "Anjuna", "Vagator" inside "North Goa"). Used by the villa
   *  form's third cascading dropdown. */
  locations?: LocationArea[];
};

export type Destination = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  description: string;
  image: Image;
  cities: City[];
};

export type Collection = {
  slug: string;
  name: string;
  blurb: string;
  image: Image;
};

export type ExperienceStatus = "draft" | "published" | "archived";
export type ExperienceDifficulty = "Easy" | "Moderate" | "Challenging";

/** A reusable category (Food, Adventure, Wellness…). Stored in
 *  data/experience-categories.json; admin can add unlimited ones. */
export type ExperienceCategory = {
  slug: string;
  name: string;
  /** lucide-react icon name, e.g. "UtensilsCrossed". */
  icon?: string;
};

/** A reusable host — one host can front many experiences. Stored in
 *  data/experience-hosts.json and referenced by `hostId`. */
export type ExperienceHost = {
  id: string;
  name: string;
  photo?: Image;
  bio?: string;
  languages?: string[];
  yearsExperience?: number;
  guestsHosted?: number;
  rating?: number;
  verified?: boolean;
  instagram?: string;
  whatsapp?: string;
  email?: string;
};

/** A single stop on the "Your Journey" timeline. */
export type ItineraryStop = {
  id: string;
  /** Display time, e.g. "4:30 PM". */
  time?: string;
  title: string;
  description?: string;
  /** e.g. "30 min". */
  duration?: string;
  photo?: Image;
};

/** Icon + label pill used by Things to Carry. */
export type CarryItem = { label: string; icon?: string };

/** A gallery photo tagged so the gallery tabs (All / Food / Places /
 *  Guests / Videos) can filter it. */
export type ExperiencePhoto = Image & {
  /** "places" | "food" | "guests" | "videos" — free-form; drives tabs. */
  category?: string;
};

/**
 * Experience — a single bookable/inquirable guided experience in the
 * marketplace (e.g. "Old Goa Heritage Food Walk"). The first four fields
 * (slug/name/blurb/image) are kept from the original concierge model so
 * the villa "Enhance Your Stay" section and cards keep compiling; every
 * other field is optional and powers the rich detail page + admin CMS.
 */
export type Experience = {
  slug: string;
  name: string;
  /** Short one-liner for cards. */
  blurb: string;
  /** Cover photo used on cards and as the detail-page hero. */
  image: Image;

  /* --- Lifecycle & classification --- */
  status?: ExperienceStatus;
  /** Category slug (see ExperienceCategory). */
  category?: string;
  /** Location — citySlug matches a city in lib/data/locations. */
  citySlug?: string;
  city?: string;
  state?: string;
  country?: string;
  featured?: boolean;
  trending?: boolean;
  featuredOrder?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;

  /* --- Presentation --- */
  /** Small tagline under the title, e.g. "Taste. Wander. Connect." */
  subtitle?: string;
  hero?: {
    title?: string;
    description?: string;
  };
  /** Long description shown in the overview / hero lede. */
  overview?: string;
  shortDescription?: string;

  /* --- Quick facts --- */
  priceFrom?: number;
  currency?: string;
  /** e.g. "3 Hours". */
  duration?: string;
  /** e.g. "4:30 PM – 7:30 PM". */
  durationLabel?: string;
  groupMin?: number;
  groupMax?: number;
  languages?: string[];
  difficulty?: ExperienceDifficulty;
  meetingPoint?: string;
  pickupAvailable?: boolean;
  pickupNote?: string;
  ageLimit?: string;
  privateAvailable?: boolean;
  accessibility?: string;
  /** e.g. "8+ Tastings". */
  mealsIncluded?: string;
  cancellationPolicy?: string;

  /* --- Social proof --- */
  rating?: number;
  reviewCount?: number;

  /* --- Rich content --- */
  highlights?: string[];
  itinerary?: ItineraryStop[];
  /** Reference into data/experience-hosts.json. */
  hostId?: string;
  /** Green ✓ list. */
  included?: string[];
  /** Red ✗ list. */
  excluded?: string[];
  thingsToCarry?: CarryItem[];
  gallery?: ExperiencePhoto[];
  videos?: Array<{ url: string; poster?: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  relatedSlugs?: string[];

  /* --- SEO --- */
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  /** Legacy concierge field — retained so old data still typechecks. */
  perfectFor?: string[];
  whatsIncluded?: Array<{ title: string; description: string; icon?: string }>;
};
