import { useEffect, useState } from "react";
import { MATERIAL_CATEGORIES, MATERIAL_TYPES, UNITS_BY_TYPE } from "../../lib/constants";
import { createMaterial, saveMaterialEdit } from "../../lib/firestore/rawMaterials";

const EMPTY_FORM = {
  name: "",
  category: MATERIAL_CATEGORIES[0],
  materialType: "General",
  unit: "g",
  stockQty: "",
  costPerUnit: "",
  minStockAlert: "",
};

export function EditMaterialModal({ open, mode, material, userId, onClose, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && material) {
      setForm({
        name: material.name ?? "",
        category: material.category ?? MATERIAL_CATEGORIES[0],
        materialType: material.materialType ?? "General",
        unit: material.unit ?? "g",
        stockQty: String(material.stockQty ?? 0),
        costPerUnit: String(material.costPerUnit ?? 0),
        minStockAlert: String(material.minStockAlert ?? 0),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [open, mode, material]);

  if (!open) return null;

  const availableUnits = UNITS_BY_TYPE[form.materialType] ?? UNITS_BY_TYPE.General;

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "materialType" && !UNITS_BY_TYPE[value]?.includes(prev.unit)) {
        next.unit = UNITS_BY_TYPE[value]?.[0] ?? "g";
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const stockQty = Number(form.stockQty.replace(/,/g, ""));
    const costPerUnit = Number(form.costPerUnit.replace(/,/g, ""));
    const minStockAlert = Number(form.minStockAlert.replace(/,/g, ""));

    if (!name) { setError("Enter a material name."); return; }
    if (!Number.isFinite(stockQty) || stockQty < 0) { setError("Stock quantity must be 0 or more."); return; }
    if (!Number.isFinite(costPerUnit) || costPerUnit < 0) { setError("Cost per unit must be 0 or more."); return; }
    if (!Number.isFinite(minStockAlert) || minStockAlert < 0) { setError("Min stock alert must be 0 or more."); return; }

    const fields = { name, category: form.category, materialType: form.materialType, unit: form.unit, stockQty, costPerUnit, minStockAlert };

    setSaving(true);
    try {
      if (mode === "edit") {
        await saveMaterialEdit(material.id, fields);
        onDone(`✓ ${name} Edited`);
      } else {
        await createMaterial(fields, userId);
        onDone("✓ Raw Material added");
      }
    } catch {
      setError("Something went wrong saving this material. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    /*
      Overlay: fixed inset-0 so it covers the whole screen.
      Inner wrapper: overflow-y-auto so the modal content scrolls
      when the keyboard pushes the viewport up on mobile.
      The modal card itself has no fixed height — it grows with content
      and the scroll container handles overflow.
    */
    <div className="fixed inset-0 z-40 bg-ink/40" onClick={onClose}>
      <div
        className="flex min-h-full items-start justify-center overflow-y-auto px-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
          <h2 className="font-display text-xl text-ink">
            {mode === "edit" ? "Edit raw material" : "New raw material"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "edit"
              ? "Direct corrections only — for adding stock, use Restock instead."
              : "Starting stock and cost become the baseline going forward."}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft" htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-soft" htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                >
                  {MATERIAL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft" htmlFor="materialType">Material type</label>
                <select
                  id="materialType"
                  value={form.materialType}
                  onChange={(e) => updateField("materialType", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                >
                  {MATERIAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-soft" htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  value={form.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                >
                  {availableUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft" htmlFor="stockQty">Stock qty</label>
                <input
                  id="stockQty"
                  inputMode="decimal"
                  placeholder="e.g. 1,000"
                  value={form.stockQty}
                  onChange={(e) => updateField("stockQty", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none placeholder:text-ink-soft/50 focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft" htmlFor="costPerUnit">Cost/unit</label>
                <input
                  id="costPerUnit"
                  inputMode="decimal"
                  placeholder="e.g. 85.00"
                  value={form.costPerUnit}
                  onChange={(e) => updateField("costPerUnit", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none placeholder:text-ink-soft/50 focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft" htmlFor="minStockAlert">Min stock alert threshold</label>
              <input
                id="minStockAlert"
                inputMode="decimal"
                placeholder="e.g. 10"
                value={form.minStockAlert}
                onChange={(e) => updateField("minStockAlert", e.target.value)}
                className="mt-1.5 w-full max-w-[10rem] rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none placeholder:text-ink-soft/50 focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>

            {error && <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-medium text-ink-soft transition hover:bg-paper">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-ink px-4 py-2 font-medium text-paper transition hover:bg-ink/90 disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
