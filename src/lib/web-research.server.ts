type ResearchSource = {
  title: string;
  url: string;
  description: string;
};

type FirecrawlResult = {
  data?: Array<{
    url?: string;
    title?: string;
    description?: string;
    markdown?: string;
  }>;
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firecrawl/v2";

function trimText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** Fetch a small, cited set of current web results for the assistant. */
export async function researchNigerianWeb(query: string): Promise<ResearchSource[]> {
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!lovableApiKey || !firecrawlApiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${GATEWAY_URL}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": firecrawlApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `Nigeria university careers jobs skills admission ${query.slice(0, 900)}`,
        limit: 5,
        country: "ng",
        lang: "en",
        scrapeOptions: { formats: ["markdown"] },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Web research failed [${response.status}]: ${await response.text()}`);
      return [];
    }

    const payload = (await response.json()) as FirecrawlResult;
    return (payload.data ?? [])
      .map((item) => ({
        title: trimText(item.title, 140),
        url: trimText(item.url, 500),
        description: trimText(item.markdown || item.description, 900),
      }))
      .filter((item) => item.title && item.url && /^https?:\/\//i.test(item.url));
  } catch (error) {
    console.error("Web research unavailable:", error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}