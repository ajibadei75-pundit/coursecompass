import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, generateText, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit.server";

import {
  COURSECOMPASS_STYLE_RULES,
  VALIDATOR_SYSTEM_PROMPT,
  buildValidatorPrompt,
} from "@/lib/response-validator.server";
import { researchNigerianWeb } from "@/lib/web-research.server";

const DRAFTER_SYSTEM_PROMPT = `You are the CourseandJobCompass AI Career Assistant, drafting an answer for a Nigerian student.

Audience: Nigerian secondary-school students, JAMB candidates, undergraduates placed in a course they did not want, and fresh graduates.

Draft a thorough, Nigeria-specific answer. Be warm and concrete. Mention realistic Naira salary ranges, real Nigerian universities (UI, UNILAG, OAU, UNN, ABU, FUTA, UNIBEN), real Nigerian employers, and concrete skills/certifications/free courses where useful. Be honest about AI/automation risk but show paths to relevance. Never invent specific statistics — if unsure, say so.

Your draft will be passed to a validator that enforces final structure and citations, so focus on accurate, useful content rather than perfect formatting. Aim for ~300 words.

${COURSECOMPASS_STYLE_RULES}`;

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "user") continue;
    const text = msg.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .trim();
    if (text) return text;
  }
  return "";
}

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Abuse protection: 15 chat requests per IP per minute.
        const { allowed, retryAfterSeconds } = checkRateLimit(
          `chat:${clientIpFromRequest(request)}`,
          { limit: 15, windowMs: 60_000 },
        );
        if (!allowed) {
          return new Response("Too many requests. Please slow down.", {
            status: 429,
            headers: { "retry-after": String(retryAfterSeconds) },
          });
        }

        if ((request.headers.get("content-length") ?? "0").length > 0) {
          const len = Number(request.headers.get("content-length") ?? 0);
          if (len > 200_000) return new Response("Payload too large", { status: 413 });
        }

        const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        if (body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
          return new Response("Invalid conversation length", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        const gateway = key ? createLovableAiGatewayProvider(key) : null;
        if (!gateway) {
          return new Response("Missing AI credentials", { status: 500 });
        }

        // Use Gemini Flash models — highest rate limits on Lovable AI Gateway.
        // Drafter (Flash Lite) is fast and cheap; validator (Flash) polishes structure.
        const drafterModel = gateway("google/gemini-flash-lite-latest");
        const validatorModel = gateway("google/gemini-flash-latest");

        const messages = body.messages as UIMessage[];
        const userQuestion = extractLastUserText(messages).slice(0, MAX_CHARS);
        if (!userQuestion) {
          return new Response("Empty question", { status: 400 });
        }
        const modelMessages = await convertToModelMessages(messages);

        const webSources = await researchNigerianWeb(userQuestion);
        const researchContext = webSources.length
          ? `\n\nCURRENT WEB RESEARCH (use only as supporting evidence; do not invent beyond it):\n${webSources
              .map((source, index) => `[${index + 1}] ${source.title} — ${source.url}\n${source.description}`)
              .join("\n\n")}`
          : "\n\nCURRENT WEB RESEARCH: No live sources were available. Mark time-sensitive claims as [Unverified].";

        // Pass 1 — draft (non-streaming so the validator can rewrite it whole)
        let draft = "";
        try {
          const drafted = await generateText({
            model: drafterModel,
            system: DRAFTER_SYSTEM_PROMPT,
            messages: [
              ...modelMessages,
              { role: "user", content: researchContext },
            ],
          });
          draft = drafted.text;
        } catch (err) {
          console.error("Drafter pass failed:", err);
          return new Response("Drafter failed", { status: 502 });
        }

        // Pass 2 — validator streams the final, house-style answer
        const result = streamText({
          model: validatorModel,
          system: VALIDATOR_SYSTEM_PROMPT,
           prompt: buildValidatorPrompt(
             userQuestion,
             `${draft}\n\nResearch sources to cite when used:\n${webSources
               .map((source, index) => `[${index + 1}] ${source.title} — ${source.url}`)
               .join("\n") || "No live sources available."}`,
           ),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
        });
      },
    },
  },
});
