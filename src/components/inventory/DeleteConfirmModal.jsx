/**
 * DeleteConfirmModal — reusable "are you sure?" dialog before destructive actions.
 * Non-blocking backdrop, scrollable on mobile, no auto-zoom (text-base on inputs).
 */
export function DeleteConfirmModal({ open, materialName, onConfirm, onClose, deleting }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <div
        className="flex min-h-full items-start justify-center overflow-y-auto px-4 py-24"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
          {/* Warning icon */}
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-alert-soft">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-alert">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2 className="font-display text-xl text-ink">Delete material?</h2>
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-medium text-ink">{materialName}</span> will be removed from
            the inventory list on both the web app and the POS. Past orders and stock history are kept.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="rounded-lg px-4 py-2 font-medium text-ink-soft transition hover:bg-paper disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="rounded-lg bg-alert px-4 py-2 font-medium text-white transition hover:bg-alert/90 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
