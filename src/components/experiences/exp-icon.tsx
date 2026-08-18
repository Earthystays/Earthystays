import {
  Backpack,
  Baby,
  Bike,
  Bird,
  Camera,
  ChefHat,
  Clock,
  Footprints,
  Gem,
  GlassWater,
  Globe,
  Hammer,
  Landmark,
  MapPin,
  Mountain,
  Shirt,
  Sparkles,
  Sun,
  Tent,
  Trees,
  Users,
  UtensilsCrossed,
  Waves,
  Flower2,
  Dot,
  type LucideIcon,
} from "lucide-react";

/** Maps the icon-name strings used in seed/admin data to lucide icons. */
const MAP: Record<string, LucideIcon> = {
  Backpack,
  Baby,
  Bike,
  Bird,
  Camera,
  ChefHat,
  Clock,
  Footprints,
  Gem,
  GlassWater,
  Globe,
  Hammer,
  Landmark,
  MapPin,
  Mountain,
  Shirt,
  Sparkles,
  Sun,
  Tent,
  Trees,
  Users,
  UtensilsCrossed,
  Waves,
  Flower2,
};

export function ExpIcon({
  name,
  className,
  strokeWidth = 1.6,
}: {
  name?: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = (name && MAP[name]) || Dot;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
