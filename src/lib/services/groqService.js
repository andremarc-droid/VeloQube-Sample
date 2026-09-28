/**
 * Groq AI Service for VeloQube Sample Inventory
 * Replicating and translating GroqService from Flutter/Dart to JavaScript (ESM).
 *
 * NOTE: The API key is read from import.meta.env.VITE_GROQ_API_KEY
 * (set in your .env.local file) or passed in directly.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

// Models available on Groq as shown on your GroqCloud dashboard:
// 1. openai/gpt-oss-120b (Best quality, high-intelligence reasoning)
// 2. openai/gpt-oss-20b (Blazing fast, lightweight MoE)
// 3. qwen/qwen3.8-27b (High performance reasoning)
export const SUPPORTED_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

export const GROQ_MODEL =
  import.meta.env.VITE_GROQ_MODEL || SUPPORTED_MODELS[0];

export function getActiveApiKey(overrideKey) {
  if (overrideKey) return overrideKey.trim();
  if (import.meta.env.VITE_GROQ_API_KEY) return import.meta.env.VITE_GROQ_API_KEY.trim();
  if (typeof window !== "undefined") {
    return (localStorage.getItem("veloqube_groq_api_key") || "").trim();
  }
  return "";
}

export function hasApiKey() {
  return Boolean(getActiveApiKey());
}

/**
 * Core helper to query Groq Chat Completions API with automatic model fallback
 */
async function callGroq({ prompt, apiKey, maxTokens = 180, temperature = 0.6 }) {
  const key = getActiveApiKey(apiKey);

  if (!key) {
    return "API key missing. Add VITE_GROQ_API_KEY to your .env.local to generate real-time AI suggestions.";
  }

  // Try the configured model first, then fall back to other available models if needed
  const modelsToTry = [GROQ_MODEL, ...SUPPORTED_MODELS.filter((m) => m !== GROQ_MODEL)];
  let lastError = "";

  for (const model of modelsToTry) {
    try {
      const response = await fetch(GROQ_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert cafe inventory and operations manager for a cafe using the VeloQube Sample POS in the Philippines. Provide concise, actionable, data-driven advice. Use Philippine Pesos (₱) for costs. Do not use generic filler. Keep answers to 2-3 clear sentences.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || "No suggestions available.";
      }

      const errData = await response.json().catch(() => ({}));
      lastError = errData?.error?.message || response.statusText;

      // If error is not a model availability error, don't loop endlessly
      if (!lastError.toLowerCase().includes("model") && response.status !== 404) {
        break;
      }
    } catch (error) {
      console.error(`Error querying Groq model ${model}:`, error);
      lastError = error.message;
    }
  }

  return `Unable to generate suggestion at this time (${lastError}).`;
}

export const GroqService = {
  /**
   * Generates prioritized restock suggestions for low-stock and critical items.
   */
  async getRestockSuggestions({ materials = [], lowStockMaterials = [] }, apiKey) {
    if (!materials.length) {
      return "No inventory items found. Add raw materials to receive restock recommendations.";
    }

    if (!lowStockMaterials.length) {
      return "All raw materials are currently above their minimum stock thresholds. No urgent restocking is required today.";
    }

    const lowStockSummary = lowStockMaterials
      .map(
        (m) =>
          `- ${m.name} (${m.category}): Current ${m.stockQty} ${m.unit} vs Min Alert ${m.minStockAlert} ${m.unit} (Cost: ₱${m.costPerUnit}/${m.unit})`
      )
      .join("\n");

    const prompt = `
Analyze these raw materials that are at or below alert thresholds for VeloQube Sample Cafe:
${lowStockSummary}

Total items needing attention: ${lowStockMaterials.length}.
Provide a 2-3 sentence restock action plan: identify the most urgent 1-2 items to reorder first and suggest safe reorder amounts. Professional and decisive tone. No bullet points.
`;

    return callGroq({ prompt, apiKey });
  },

  /**
   * Generates cost and capital efficiency insights based on inventory valuation.
   */
  async getCostOptimizationInsight({ materials = [], totalValuation = 0 }, apiKey) {
    if (!materials.length) {
      return "No inventory records available to analyze capital allocation.";
    }

    // Sort materials by tied-up capital
    const sortedByValue = [...materials]
      .map((m) => ({
        name: m.name,
        category: m.category,
        value: (Number(m.stockQty) || 0) * (Number(m.costPerUnit) || 0),
        unit: m.unit,
      }))
      .sort((a, b) => b.value - a.value);

    const topItems = sortedByValue.slice(0, 3);
    const topSummary = topItems
      .map((m) => `${m.name} (₱${m.value.toFixed(2)})`)
      .join(", ");

    const prompt = `
Evaluate the current inventory capital for VeloQube Sample Cafe:
- Total inventory valuation: ₱${Number(totalValuation).toFixed(2)}
- Total unique raw materials: ${materials.length}
- Highest value holdings: ${topSummary}

Provide a 2-sentence financial advice summary for the cafe manager. Focus on cost control, avoiding tied-up cash, or inventory holding risks. No bullet points.
`;

    return callGroq({ prompt, apiKey });
  },

  /**
   * Suggests promotional specials or FIFO rotation for perishable ingredients with surplus stock.
   */
  async getPerishableAndWasteInsight({ materials = [] }, apiKey) {
    if (!materials.length) {
      return "Add items under Dairy, Fresh Produce, or Beverage Supplies to receive waste-reduction suggestions.";
    }

    const perishableCategories = ["Dairy & Refrigerated Items", "Fresh Produce", "Beverage Supplies"];
    const perishables = materials.filter((m) => perishableCategories.includes(m.category));

    if (!perishables.length) {
      return "No high-spoilage items currently registered in inventory.";
    }

    const perishableList = perishables
      .slice(0, 6)
      .map((m) => `${m.name} (${m.stockQty} ${m.unit})`)
      .join(", ");

    const prompt = `
Review these perishable cafe ingredients currently in stock for VeloQube Sample Cafe:
${perishableList}

Provide a 2-sentence recommendation to minimize spoilage and boost turnover (e.g. suggesting a barista drink special or strict FIFO stock rotation). Action-oriented cafe tone. No bullet points.
`;

    return callGroq({ prompt, apiKey });
  },

  /**
   * Quick recommendation for an individual material (e.g., inside the Restock modal).
   */
  async getMaterialRestockSuggestion(material, apiKey) {
    if (!material) return "";

    const prompt = `
A cafe manager is restocking "${material.name}" (${material.category}):
- Current stock: ${material.stockQty} ${material.unit}
- Minimum alert threshold: ${material.minStockAlert} ${material.unit}
- Unit cost: ₱${material.costPerUnit}

In one brief sentence, suggest an optimal restock quantity to maintain a healthy 2-3 week operating buffer.
`;

    return callGroq({ prompt, apiKey, maxTokens: 80 });
  },
};

export default GroqService;
