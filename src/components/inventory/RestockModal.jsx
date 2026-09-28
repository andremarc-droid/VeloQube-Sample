import { useEffect, useState } from "react";
import { formatCurrency } from "../../lib/constants";
import { restockMaterial } from "../../lib/firestore/rawMaterials";

export function RestockModal({ open, material, userId, onClose, onDone }) {
  const [qtyInput, setQtyInput] = useState("");
  const [costInput, setCostInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && material) {
      setQtyInput("");
      setCostInput(String(material.costPerUnit ?? 0));
      setError("");
    }
  }, [open, material]);

  if (!open || !material) return null;

  const existingQty = Number(material.stockQty) || 0;
  const existingCost = Number(material.costPerUnit) || 0;

  const qty = Number(qtyInput);
  const qtyValid = qtyInput.trim() !== "" && Number.isFinite(qty) && qty > 0;

  const costIsBlank = costInput.trim() === "";
  const parsedCost = Number(costInput);
  const costValid = costIsBlank || (Number.isFinite(parsedCost) && parsedCost >= 0);
  const effectiveCost = costIsBlank ? existingCost : parsedCost;

  let preview = null;
  if (qtyValid && costValid) {
    const newQty = existingQty + qty;
    const newCost = existingQty <= 0 ? effectiveCost : (existingQty * existingCost + qty * effectiveCost) / newQty;
    preview = { newQty, newCost };
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setError("");
    if (!qtyValid) { setError("Enter a quantity greater than 0."); return; }
    if (!costValid) { setError("Enter a valid cost per unit."); return; }

    setSaving(true);
    try {
      await restockMaterial({ materialId: material.id, addQty: qty, restockCost: effectiveCost, userId });
      onDone(`✓ ${material.name} Restocked`);
    } catch {
      setError("Something went wrong applying this restock. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/40" onClick={onClose}>
      <div
        className="flex min-h-full items-start justify-center overflow-y-auto px-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
          <h2 className="font-display text-xl text-ink">Restock {material.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Current: {existingQty.toLocaleString()} {material.unit} @ {formatCurrency(existingCost)}/unit
          </p>

          <form onSubmit={handleConfirm} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft" htmlFor="restockQty">
                Quantity to add
              </label>
              <input
                id="restockQty"
                inputMode="decimal"
                autoFocus
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                placeholder={`0 ${material.unit}`}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft" htmlFor="restockCost">
                Cost per unit (this restock)
              </label>
              <input
                id="restockCost"
                inputMode="decimal"
                value={costInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCostInput(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
              <p className="mt-1 text-xs text-ink-soft">
                Leave as-is for no price change — only edit if the new stock cost differently.
              </p>
            </div>

            <div className="rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-ink">
              {preview ? (
                <>
                  New stock: <strong className="tabular-figures">{preview.newQty.toLocaleString()} {material.unit}</strong>
                  {" · "}
                  New WAC cost: <strong className="tabular-figures">{formatCurrency(preview.newCost)}/unit</strong>
                </>
              ) : (
                <span className="text-ink-soft">Enter a quantity to see the new stock and cost.</span>
              )}
            </div>

            {error && <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-medium text-ink-soft transition hover:bg-paper">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-medium text-paper transition hover:bg-accent/90 disabled:opacity-60">
                {saving ? "Restocking…" : "Confirm restock"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
