# VeloQube Web (Sample)

Web inventory app for the **VeloQube Sample POS** pitch prototype. It manages raw materials
(add, edit, restock with weighted-average cost, delete) and shows an AI advisor powered by Groq.

It shares one Firebase project with the desktop POS, so a restock done here shows up in the
POS, and a sale rung up in the POS deducts stock here, both in real time.

## Setup

1. Create a **new** Firebase project (not the Block 11 Cafe one).
   - Build > Firestore Database: create it.
   - Build > Authentication > Sign-in method: enable **Email/Password**, then add a user
     (for example `pos@veloqube-demo.com`). The desktop POS signs in as this same account
     (set in its `db_config.ini`), and you can use it to sign in to this web app too.
2. Project settings > Your apps > add a **Web** app and copy its config.
3. Copy `.env.example` to `.env.local` and fill it in (the Groq key is optional).
4. Publish the rules: `firebase deploy --only firestore:rules`, or paste `firestore.rules`
   into the Firestore console. **The desktop POS cannot write anything until this is done.**
5. `npm install`, then `npm run dev`.

## How it stays in sync with the desktop POS

There is no sync service. Both apps read and write the same Firestore collections:

| Collection | Used for |
|---|---|
| `rawMaterials/{id}` | Inventory. Doc ID is an integer; `isActive=false` means deleted. |
| `stockMovements/{id}` | Append-only stock audit trail. |
| `counters/{name}` | Last integer ID handed out. Both apps take IDs inside a transaction. |
| `users`, `categories`, `menuItems`, `orders`, `activityLogs`, `products` | Desktop POS only. |

Rules of the road when changing `src/lib/firestore/rawMaterials.js`:
- Keep the field names identical to the desktop app (`RawMaterialRepository.cs`).
- Never hard-delete a material; set `isActive=false`.
- Get new IDs from `counters/*` in a transaction, never with an auto-generated doc ID.

## Deploy

`vercel.json` already rewrites all routes to `index.html`. Add the same `VITE_*` variables in
the hosting dashboard.
