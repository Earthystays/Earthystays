import type { Amenity } from "@/lib/types";

export const VILLA_AMENITIES: readonly Amenity[] = [
  // Pool & wellness
  "Private Pool",
  "Hot Tub",
  "Spa",
  "Gym",
  // Outdoor
  "Sea View",
  "Beachfront",
  "Mountain View",
  "Garden",
  "Bonfire",
  // Climate / utility
  "Wi-Fi",
  "Air Conditioning",
  "Ceiling Fan",
  "Heating",
  "Fireplace",
  // Kitchen & dining
  "Kitchen",
  "Fridge",
  "Microwave",
  "Coffee Maker",
  "Kettle",
  "Crockery and Cutlery",
  // Bathroom
  "Hot Water",
  "Hairdryer",
  "Towels",
  "Shampoo",
  "Conditioner",
  "Shower Gel",
  // Bedroom & laundry
  "Washing Machine",
  "Iron",
  "Essentials",
  "Hangers",
  "Bed Linen",
  // Entertainment
  "TV",
  "Smart TV",
  "Speakers",
  "Board Games",
  "Game Room",
  // Family / pets
  "Pet Friendly",
  "Kids Play Area",
  "Crib",
  "High Chair",
  // Services
  "Chef on Call",
] as const;

export const VILLA_FACILITIES = [
  // Parking & facilities
  "Free Parking",
  "EV Charging",
  "Wheelchair Access",
  "Private Entrance",
  // Common villa services
  "Shared Pool",
  "24/7 Security",
  "Power Backup",
  "Caretaker",
  "Housekeeping",
  "Laundry",
  "Conference Room",
  "Dedicated Workspace",
  // Outdoor amenities
  "Bonfire Pit",
  "Outdoor Dining",
  "Outdoor Shower",
  "BBQ Grill",
  // Safety
  "Smoke Alarm",
  "Fire Extinguisher",
  "First Aid Kit",
  "Security Cameras",
  "Safe",
] as const;

export const MEAL_PRESETS = [
  {
    value: "self-catering",
    label: "Self-catering",
    description:
      "The villa has a full kitchen — guests cook for themselves. We can arrange a cook on request.",
  },
  {
    value: "breakfast",
    label: "Breakfast included",
    description:
      "Breakfast is prepared by the house staff every morning of your stay. Lunch and dinner are not included.",
  },
  {
    value: "all-meals",
    label: "All meals included",
    description:
      "Breakfast, lunch and dinner are all included. The cook plans menus around your preferences; alcohol is not included.",
  },
  {
    value: "chef-included",
    label: "In-house chef (included)",
    description:
      "A house chef is included with your stay. Share dietary preferences in advance and they'll plan breakfast, lunch and dinner accordingly. Groceries billed at cost; alcohol is not provided.",
  },
  {
    value: "chef-on-request",
    label: "Chef on request",
    description:
      "We can arrange a chef on request for an additional charge — ask our concierge when you inquire.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "",
  },
] as const;

export const CANCELLATION_PRESETS = [
  {
    value: "flexible",
    label: "Flexible",
    description:
      "Full refund up to 7 days before check-in. After that, the first night is non-refundable.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description:
      "Full refund up to 14 days before check-in. 50% refund between 7–14 days. No refund within 7 days.",
  },
  {
    value: "strict",
    label: "Strict",
    description:
      "50% refund up to 30 days before check-in. No refund within 30 days of stay.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "",
  },
] as const;
