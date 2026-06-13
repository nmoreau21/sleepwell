export const CLOTHING_CATEGORY = "clothing";

export const DONATION_ITEM_KINDS = [
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
] as const;

export type DonationItemKind = (typeof DONATION_ITEM_KINDS)[number]["value"];

export const CLOTHING_TYPES = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
] as const;

export type ClothingType = (typeof CLOTHING_TYPES)[number]["value"];

export const CLOTHING_GENDER_CATEGORIES = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
  { value: "unisex", label: "Unisex" },
] as const;

export type ClothingGenderCategory =
  (typeof CLOTHING_GENDER_CATEGORIES)[number]["value"];
