// Mirrors the category/type/unit vocabulary from the VeloQube Sample POS's Raw Materials
// screen (Block 11 Cafe/ViewModels/InventoryViewModel.cs in the desktop solution) so the
// two systems speak the same language.

export const MATERIAL_CATEGORIES = [
  "Dry Goods",
  "Dairy & Refrigerated Items",
  "Fresh Produce",
  "Frozen Goods",
  "Beverage Supplies",
];

export const MATERIAL_TYPES = ["Solid", "Liquid", "Packaging", "General"];

export const UNITS_BY_TYPE = {
  Solid: ["g", "kg"],
  Liquid: ["ml", "liter"],
  Packaging: ["pcs"],
  General: ["g", "kg", "ml", "liter", "pcs"],
};

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
