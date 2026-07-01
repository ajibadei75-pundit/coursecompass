import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, generateText, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  COURSECOMPASS_STYLE_RULES,
  VALIDATOR_SYSTEM_PROMPT,
  buildValidatorPrompt,
} from "@/lib/response-validator.server";

const DRAFTER_SYSTEM_PROMPT = `You are the CourseCompass AI Career Assistant, drafting an answer for a Nigerian student.

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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        const key = process.env.LOVABLE_API_KEY;

        // Drafter: Claude when available (warmer), GPT-5 fallback.
        // Validator: always GPT-5 (consistent structural enforcement).
        const gateway = key ? createLovableAiGatewayProvider(key) : null;
        const drafterModel = anthropicKey
          ? createAnthropic({ apiKey: anthropicKey })("claude-sonnet-4-5-20250929")
          : gateway
            ? gateway("openai/gpt-5")
            : null;
        const validatorModel = gateway
          ? gateway("openai/gpt-5")
          : anthropicKey
            ? createAnthropic({ apiKey: anthropicKey })("claude-sonnet-4-5-20250929")
            : null;

        if (!drafterModel || !validatorModel) {
          return new Response("Missing AI credentials", { status: 500 });
        }

        const messages = body.messages as UIMessage[];
        const userQuestion = extractLastUserText(messages);
        const modelMessages = await convertToModelMessages(messages);

        // Pass 1 — draft (non-streaming so the validator can rewrite it whole)
        let draft = "";
        try {
          const drafted = await generateText({
            model: drafterModel,
            system: DRAFTER_SYSTEM_PROMPT,
            messages: modelMessages,
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
          prompt: buildValidatorPrompt(userQuestion, draft),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
        });
      },
    },
  },
});
