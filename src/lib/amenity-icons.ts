import {
  Waves,
  Eye,
  PawPrint,
  Bath,
  ChefHat,
  Wifi,
  AirVent,
  Umbrella,
  Mountain,
  Flame,
  Trees,
  Dumbbell,
  Sparkles,
  Gamepad2,
  Car,
  ShieldCheck,
  Zap,
  Sprout,
  Tv,
  Coffee,
  Wine,
  Utensils,
  Music,
  WashingMachine,
  Sun,
  Camera,
  Bike,
  Heart,
  Wind,
  Thermometer,
  Refrigerator,
  Microwave,
  Bell,
  Briefcase,
  Shirt,
  BedDouble,
  Droplet,
  Soup,
  CookingPot,
  BookOpen,
  Baby,
  Building2,
  AlertTriangle,
  Lock,
  Check,
  type LucideIcon,
} from "lucide-react";

/**
 * Lookup table — keys are normalized (lowercased, common variations).
 * For unknown amenities, the renderer falls back to the Check icon.
 */
const ICONS: Record<string, LucideIcon> = {
  // pool / water
  "private pool": Waves,
  pool: Waves,
  "shared pool": Waves,
  "sea view": Eye,
  beachfront: Umbrella,
  "hot tub": Bath,
  jacuzzi: Bath,

  // wellness
  spa: Sparkles,
  gym: Dumbbell,
  yoga: Heart,

  // climate / utility
  "wi-fi": Wifi,
  wifi: Wifi,
  "air conditioning": AirVent,
  ac: AirVent,

  // outdoor
  "mountain view": Mountain,
  garden: Trees,
  bonfire: Flame,
  "bonfire pit": Flame,
  fireplace: Flame,
  "outdoor dining": Utensils,
  "outdoor shower": Sun,
  "bbq grill": Utensils,

  // pets & family
  "pet friendly": PawPrint,
  "kids play area": Heart,

  // service
  "chef on call": ChefHat,
  caretaker: Heart,
  housekeeping: Sparkles,

  // entertainment
  "game room": Gamepad2,
  tv: Tv,

  // facilities
  parking: Car,
  "24/7 security": ShieldCheck,
  "power backup": Zap,
  "ev charging": Zap,
  "conference room": Utensils,
  laundry: WashingMachine,
  "wheelchair access": Heart,

  // misc keywords commonly used as custom amenities
  coffee: Coffee,
  "coffee maker": Coffee,
  "espresso machine": Coffee,
  kettle: Coffee,
  toaster: CookingPot,
  bar: Wine,
  wine: Wine,
  "wine glasses": Wine,
  music: Music,
  speakers: Music,
  "sound system": Music,
  bike: Bike,
  bicycles: Bike,
  camera: Camera,
  "yoga deck": Sprout,

  // bathroom
  hairdryer: Wind,
  "hair dryer": Wind,
  "cleaning products": Droplet,
  shampoo: Droplet,
  conditioner: Droplet,
  "hot water": Droplet,
  geyser: Droplet,
  "shower gel": Droplet,
  "body soap": Droplet,
  towels: Bath,
  toiletries: Droplet,
  bathtub: Bath,

  // bedroom & laundry
  "washing machine": WashingMachine,
  essentials: BedDouble,
  hangers: Shirt,
  "bed linen": BedDouble,
  iron: Shirt,
  closet: Shirt,
  wardrobe: Shirt,
  dryer: WashingMachine,

  // kitchen & dining (expanded)
  kitchen: Utensils,
  fridge: Refrigerator,
  refrigerator: Refrigerator,
  microwave: Microwave,
  stove: CookingPot,
  oven: CookingPot,
  dishwasher: Utensils,
  "crockery and cutlery": Utensils,
  crockery: Utensils,
  "cooking basics": Soup,
  "dining table": Utensils,

  // entertainment (expanded)
  "smart tv": Tv,
  "cable tv": Tv,
  netflix: Tv,
  "board games": Gamepad2,
  books: BookOpen,
  "pool table": Gamepad2,
  "table tennis": Gamepad2,

  // heating & cooling
  "ceiling fan": Wind,
  heating: Thermometer,
  "indoor fireplace": Flame,

  // internet & office (expanded)
  "dedicated workspace": Briefcase,
  ethernet: Wifi,
  printer: Briefcase,

  // services
  concierge: Bell,
  butler: Bell,
  "in-house chef": ChefHat,

  // family
  crib: Baby,
  "high chair": Baby,
  "pack 'n play": Baby,
  "baby monitor": Baby,
  "kids welcome": Baby,

  // parking & facilities
  "free parking": Car,
  "paid parking": Car,
  "private entrance": Building2,
  elevator: Building2,

  // safety
  "smoke alarm": AlertTriangle,
  "fire extinguisher": AlertTriangle,
  "first aid kit": Heart,
  "carbon monoxide alarm": AlertTriangle,
  "co alarm": AlertTriangle,
  "security cameras": Camera,
  "safe box": Lock,
  safe: Lock,

  // views
  "valley view": Mountain,
  "river view": Eye,
  "lake view": Eye,
  "city view": Building2,
  "forest view": Trees,
};

import { getCustomIconMap } from "./data/amenities-store";
import { ICON_NAME_TO_COMPONENT } from "./amenity-catalog";

/** Server-only helper: returns the icon NAME string for an amenity.
 *  Used by admin pages that need to ship the icon name to a client component. */
export function getAmenityIconName(name: string): string {
  const icon = getAmenityIcon(name);
  for (const [iconName, comp] of Object.entries(ICON_NAME_TO_COMPONENT)) {
    if (comp === icon) return iconName;
  }
  return "Check";
}

export function getAmenityIcon(name: string): LucideIcon {
  const key = name.toLowerCase().trim();

  // 1. Admin-defined custom amenities/facilities (highest priority)
  const customMap = getCustomIconMap();
  const customIconName = customMap[key];
  if (customIconName && ICON_NAME_TO_COMPONENT[customIconName]) {
    return ICON_NAME_TO_COMPONENT[customIconName];
  }

  // 2. Exact bundled mapping
  if (ICONS[key]) return ICONS[key];

  // 3. Partial substring match against bundled mapping
  for (const [k, icon] of Object.entries(ICONS)) {
    if (key.includes(k) || k.includes(key)) return icon;
  }
  return Check;
}
