import { useState, useEffect, useCallback } from "react";
import { GroqService, hasApiKey } from "../../lib/services/groqService";

const INSIGHT_MODES = [
  { id: "restock", label: "Restock Priority" },
  { id: "cost", label: "Capital & Costs" },
  { id: "waste", label: "Waste & Menu Ideas" },
];

/**
 * AiInsightWidget
 * Displays AI-generated inventory insights and actionable suggestions.
 */
export function AiInsightWidget({ materials = [], totalValuation = 0, lowStockMaterials = [] }) {
  const [activeMode, setActiveMode] = useState("restock");
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isKeyConfigured, setIsKeyConfigured] = useState(hasApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState("");

  const fetchInsight = useCallback(
    async (mode) => {
      setLoading(true);
      let result = "";

      try {
        if (mode === "restock") {
          result = await GroqService.getRestockSuggestions({ materials, lowStockMaterials });
        } else if (mode === "cost") {
          result = await GroqService.getCostOptimizationInsight({ materials, totalValuation });
        } else if (mode === "waste") {
          result = await GroqService.getPerishableAndWasteInsight({ materials });
        }
      } catch {
        result = "Unable to load analysis at this time.";
      } finally {
        setInsight(result);
        setLoading(false);
        setLastUpdated(new Date());
        setIsKeyConfigured(hasApiKey());
      }
    },
    [materials, lowStockMaterials, totalValuation]
  );

  useEffect(() => {
    setIsKeyConfigured(hasApiKey());
    if (materials.length > 0 && !insight && !loading) {
      fetchInsight(activeMode);
    }
  }, [materials.length, activeMode, fetchInsight, insight, loading]);

  function handleModeChange(newMode) {
    setActiveMode(newMode);
    fetchInsight(newMode);
  }

  function handleSaveKey(e) {
    e.preventDefault();
    if (tempKey.trim()) {
      localStorage.setItem("veloqube_groq_api_key", tempKey.trim());
      setIsKeyConfigured(true);
      setShowKeyInput(false);
      setTempKey("");
      fetchInsight(activeMode);
    }
  }

  function handleClearKey() {
    localStorage.removeItem("veloqube_groq_api_key");
    setIsKeyConfigured(hasApiKey());
    setInsight("");
    fetchInsight(activeMode);
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink">AI Inventory Advisor</h3>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                Groq GPT OSS 120B
              </span>
            </div>
            <p className="text-xs text-ink-soft">Smart operational suggestions tailored to VeloQube Sample</p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <div className="flex max-w-full overflow-x-auto rounded-lg bg-paper p-1 text-xs font-medium">
            {INSIGHT_MODES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleModeChange(tab.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 transition ${
                  activeMode === tab.id
                    ? "bg-surface text-ink shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchInsight(activeMode)}
            disabled={loading}
            title="Refresh analysis"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-paper hover:text-ink disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M21 21v-5h-5" />
            </svg>
            <span>{loading ? "Analyzing..." : "Refresh"}</span>
          </button>

          {!isKeyConfigured && (
            <button
              onClick={() => setShowKeyInput((prev) => !prev)}
              className="rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/20"
            >
              {showKeyInput ? "Close Key Setup" : "Set API Key"}
            </button>
          )}
        </div>
      </div>

      {/* Optional In-App Key Input for Quick Testing */}
      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="mt-3 rounded-xl border border-line bg-paper/60 p-3 text-xs">
          <p className="font-medium text-ink">Enter Groq API Key for instant testing:</p>
          <p className="mt-0.5 text-ink-soft">
            You can either paste your key here for immediate session testing, or save it permanently in <code className="rounded bg-paper px-1 py-0.5 text-[11px]">.env.local</code> as <code className="rounded bg-paper px-1 py-0.5 text-[11px]">VITE_GROQ_API_KEY</code>.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              placeholder="gsk_..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-3 py-1.5 font-medium text-paper hover:bg-ink/90"
            >
              Save Key
            </button>
          </div>
        </form>
      )}

      {/* Body / Insight Content */}
      <div className="pt-4">
        {loading ? (
          <div className="flex items-center gap-3 py-2 text-sm italic text-ink-soft">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Analyzing inventory data with Groq AI...
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-ink">
            {insight ? (
              <p>{insight}</p>
            ) : !isKeyConfigured ? (
              <div className="rounded-xl bg-accent-soft/60 p-3 text-sm text-ink-soft">
                <p className="font-medium text-ink">Groq AI integration is ready!</p>
                <p className="mt-1 text-xs">
                  Whenever you are ready, paste your key into <strong className="text-ink">.env.local</strong> (as <code className="rounded bg-surface px-1 py-0.5">VITE_GROQ_API_KEY</code>) or click <strong>&quot;Set API Key&quot;</strong> above to start receiving live suggestions.
                </p>
              </div>
            ) : (
              <p>Click &quot;Refresh&quot; or select an insight category to generate recommendations.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/40 pt-2.5 text-[11px] text-ink-soft/75">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isKeyConfigured ? "bg-accent" : "bg-alert"}`} />
          {isKeyConfigured ? "Groq AI connected • Live data sync" : "Waiting for API Key • Ready to connect"}
        </span>

        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
          {localStorage.getItem("veloqube_groq_api_key") && (
            <button
              onClick={handleClearKey}
              className="text-[10px] text-alert underline hover:opacity-80"
              title="Remove session API key from browser"
            >
              Clear browser key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiInsightWidget;
