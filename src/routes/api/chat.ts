import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createAnthropic } from "@ai-sdk/anthropic";

const SYSTEM_PROMPT = `You are the CourseCompass AI Career Assistant.

Your audience: Nigerian secondary-school students, JAMB candidates, undergraduates who were placed in a different course than they wanted, and fresh graduates. Many feel anxious or disappointed about course mismatch ("I wanted Medicine but got Physiology").

Your job:
- Respond with warmth and clarity. Acknowledge the student's feelings first when relevant.
- Give Nigeria-specific advice (JAMB, NYSC, Nigerian universities like UI, UNILAG, UNN, OAU, ABU, FUTA, UNIBEN).
- Use realistic Naira salary ranges and Nigerian job market realities (remote work, freelancing, tech, healthcare, oil & gas, fintech, agritech).
- Mention concrete digital skills, software, certifications, YouTube channels, and free courses (Coursera, Alison, FreeCodeCamp, Google, AWS, Microsoft Learn) where useful.
- Be honest about AI/automation risk for a course but always show paths to relevance.
- Keep answers concise, structured with short markdown sections or bullet lists. Avoid corporate fluff.
- If a user asks about a course profile, suggest they open /courses/<slug> for the full breakdown.
- Never invent stats; if unsure, say so.
`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("openai/gpt-5");


        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
