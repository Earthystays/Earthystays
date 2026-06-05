import type { Amenity } from "@/lib/types";

export const VILLA_AMENITIES: readonly Amenity[] = [
  "Private Pool",
  "Sea View",
  "Pet Friendly",
  "Hot Tub",
  "Chef on Call",
  "Wi-Fi",
  "Air Conditioning",
  "Beachfront",
  "Mountain View",
  "Fireplace",
  "Garden",
  "Gym",
  "Spa",
  "Bonfire",
  "Game Room",
] as const;

export const VILLA_FACILITIES = [
  "Parking",
  "Shared Pool",
  "24/7 Security",
  "Power Backup",
  "Caretaker",
  "Housekeeping",
  "Laundry",
  "Conference Room",
  "Kids Play Area",
  "Bonfire Pit",
  "Outdoor Dining",
  "Outdoor Shower",
  "BBQ Grill",
  "EV Charging",
  "Wheelchair Access",
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
