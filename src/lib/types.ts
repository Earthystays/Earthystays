export type Image = {
  src: string;
  alt: string;
  tag?: string; // room label e.g. "Bedroom 1", "Kitchen", "Pool"
};

export type Amenity =
  | "Private Pool"
  | "Sea View"
  | "Pet Friendly"
  | "Hot Tub"
  | "Chef on Call"
  | "Wi-Fi"
  | "Air Conditioning"
  | "Beachfront"
  | "Mountain View"
  | "Fireplace"
  | "Garden"
  | "Gym"
  | "Spa"
  | "Bonfire"
  | "Game Room";

export type PropertyType = "villa" | "apartment";

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
  featured?: boolean;
  /** 1 = first slot on the home page, 6 = last. Unset = appears after
   *  all ranked items (in load order). Capped at 6 displayed per type. */
  featuredRank?: number;
};

export type City = {
  slug: string;
  name: string;
  blurb: string;
  image: Image;
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
