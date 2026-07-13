import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider that talks directly to Google's Gemini API via its
 * OpenAI-compatible endpoint. Uses the user's own GEMINI_API_KEY
 * (free tier from https://aistudio.google.com/apikey), bypassing
 * Lovable AI Gateway credits entirely.
 *
 * Model ids passed in as "google/gemini-..." are normalised to the
 * bare Gemini name Google's API expects.
 */
export function createLovableAiGatewayProvider(
  _lovableApiKey: string,
  _initialRunId?: string,
  _options?: { structuredOutputs?: boolean },
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey.",
    );
  }

  const raw = createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    supportsStructuredOutputs: true,
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  // Wrap to strip the "google/" prefix so "google/gemini-2.5-flash" -> "gemini-2.5-flash".
  const provider = ((modelId: string) => {
    const normalized = modelId.startsWith("google/") ? modelId.slice("google/".length) : modelId;
    return raw(normalized);
  }) as unknown as ReturnType<typeof createOpenAICompatible>;

  return Object.assign(provider, {
    getRunId: () => undefined as string | undefined,
    waitForRunId: async () => undefined as string | undefined,
  });
}
