import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const MATERIALS_COLLECTION = "rawMaterials";
const MOVEMENTS_COLLECTION = "stockMovements";
const COUNTERS_COLLECTION = "counters";

// ---------------------------------------------------------------------------
// Shared data contract with the VeloQube Sample POS (desktop app)
//
// Both apps read and write the SAME Firestore project, so this file must follow
// the schema the desktop app uses (see RawMaterialRepository.cs):
//
//   rawMaterials/{id}    doc ID = integer ID; fields: rawMaterialId, sku, name,
//                        category, materialType, unit, stockQty, costPerUnit,
//                        minStockAlert, isActive, createdAt, updatedAt
//   stockMovements/{id}  audit trail: movementId, rawMaterialId, userId,
//                        changeQty, movementType, notes, costPerUnitAtTime, createdAt
//   counters/{name}      { value } -- the last integer ID handed out. New IDs are
//                        taken inside a transaction, exactly like the desktop's
//                        IdGenerator, so the two apps can never issue the same ID.
//
// Deleting is a SOFT delete (isActive = false), because old recipes and orders still
// point at the material. There is no live "sync tag" any more: both apps simply read
// and write Firestore directly, and this page updates in real time via onSnapshot.
// ---------------------------------------------------------------------------

/** Returns the current value of a counter and the ref to write its next value to. */
async function readCounter(transaction, name) {
  const ref = doc(db, COUNTERS_COLLECTION, name);
  const snap = await transaction.get(ref);
  const current = snap.exists() ? Number(snap.data().value) || 0 : 0;
  return { ref, current };
}

function movementFields({ movementId, rawMaterialId, userUid, changeQty, movementType, notes, costPerUnitAtTime }) {
  return {
    movementId,
    rawMaterialId,
    // The desktop uses integer user IDs; web users are Firebase accounts, so 0 = "web"
    // and the real identity is kept in userUid.
    userId: 0,
    userUid: userUid ?? "",
    changeQty,
    movementType,
    notes,
    costPerUnitAtTime,
    createdAt: serverTimestamp(),
  };
}

export function subscribeToMaterials(onChange, onError) {
  const materialsQuery = query(
    collection(db, MATERIALS_COLLECTION),
    orderBy("name")
  );
  return onSnapshot(
    materialsQuery,
    (snapshot) => {
      const materials = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        // Soft-deleted materials stay in Firestore but must not show up here.
        .filter((m) => m.isActive !== false);
      onChange(materials);
    },
    onError
  );
}

export async function createMaterial(fields, userId) {
  await runTransaction(db, async (transaction) => {
    const materialCounter = await readCounter(transaction, "rawMaterials");
    const needsMovement = fields.stockQty > 0;
    const movementCounter = needsMovement
      ? await readCounter(transaction, "stockMovements")
      : null;

    const newId = materialCounter.current + 1;
    transaction.set(materialCounter.ref, { value: newId });

    transaction.set(doc(db, MATERIALS_COLLECTION, String(newId)), {
      rawMaterialId: newId,
      sku: `RAW-${String(newId).padStart(3, "0")}`,
      name: fields.name,
      category: fields.category,
      materialType: fields.materialType,
      unit: fields.unit,
      stockQty: fields.stockQty,
      costPerUnit: fields.costPerUnit,
      minStockAlert: fields.minStockAlert,
      isActive: true,
      createdBy: userId ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (movementCounter) {
      const movementId = movementCounter.current + 1;
      transaction.set(movementCounter.ref, { value: movementId });
      transaction.set(
        doc(db, MOVEMENTS_COLLECTION, String(movementId)),
        movementFields({
          movementId,
          rawMaterialId: newId,
          userUid: userId,
          changeQty: fields.stockQty,
          movementType: "Restock",
          notes: "Initial stock on creation",
          costPerUnitAtTime: fields.costPerUnit,
        })
      );
    }
  });
}

export async function saveMaterialEdit(materialId, fields) {
  const materialRef = doc(db, MATERIALS_COLLECTION, materialId);
  await updateDoc(materialRef, {
    name: fields.name,
    category: fields.category,
    materialType: fields.materialType,
    unit: fields.unit,
    stockQty: fields.stockQty,
    costPerUnit: fields.costPerUnit,
    minStockAlert: fields.minStockAlert,
    updatedAt: serverTimestamp(),
  });
}

/**
 * DELETE flow -- soft delete. The document stays in Firestore with isActive = false so
 * existing recipes, orders and stock movements that reference it keep resolving, and
 * the desktop POS hides it too.
 */
export async function deleteMaterial(materialId) {
  const materialRef = doc(db, MATERIALS_COLLECTION, materialId);
  await updateDoc(materialRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * QUICK RESTOCK flow -- read-modify-write done atomically via a Firestore transaction.
 * The material is read, the Weighted Average Cost is computed, and the updated
 * stockQty/costPerUnit plus the stockMovements log entry are written in the same
 * transaction. The math matches RawMaterialRepository.RestockWithWacAsync in the POS.
 */
export async function restockMaterial({ materialId, addQty, restockCost, userId }) {
  const materialRef = doc(db, MATERIALS_COLLECTION, materialId);

  return runTransaction(db, async (transaction) => {
    const materialSnap = await transaction.get(materialRef);
    if (!materialSnap.exists()) {
      throw new Error("This material no longer exists — it may have been deleted.");
    }
    const movementCounter = await readCounter(transaction, "stockMovements");

    const data = materialSnap.data();
    const existingQty = Number(data.stockQty) || 0;
    const existingCost = Number(data.costPerUnit) || 0;
    const newQty = existingQty + addQty;

    const newCost =
      existingQty <= 0
        ? restockCost
        : (existingQty * existingCost + addQty * restockCost) / newQty;

    const movementId = movementCounter.current + 1;
    const numericId = Number(data.rawMaterialId) || Number(materialId) || 0;

    transaction.update(materialRef, {
      stockQty: newQty,
      costPerUnit: newCost,
      updatedAt: serverTimestamp(),
    });

    transaction.set(movementCounter.ref, { value: movementId });
    transaction.set(
      doc(db, MOVEMENTS_COLLECTION, String(movementId)),
      movementFields({
        movementId,
        rawMaterialId: numericId,
        userUid: userId,
        changeQty: addQty,
        movementType: "Restock",
        notes: `Restocked ${addQty} ${data.unit ?? ""} @ PHP ${restockCost}/unit`.replace("  ", " "),
        costPerUnitAtTime: restockCost,
      })
    );

    return { newQty, newCost };
  });
}
