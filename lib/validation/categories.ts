export const FURNITURE_CATEGORIES = [
  { value: "bed", label: "Bed" },
  { value: "mattress", label: "Mattress" },
  { value: "dresser", label: "Dresser" },
  { value: "table", label: "Table" },
  { value: "couch", label: "Couch / sofa" },
  { value: "chair", label: "Chair" },
  { value: "desk", label: "Desk" },
  { value: "appliance", label: "Appliance" },
  { value: "other", label: "Other" },
] as const;

export type FurnitureCategory = (typeof FURNITURE_CATEGORIES)[number]["value"];
