import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const TraitsSchema = z.object({
  analytical: z.number().min(0).max(100),
  creative: z.number().min(0).max(100),
  social: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  entrepreneurial: z.number().min(0).max(100),
  leadership: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  numerical: z.number().min(0).max(100),
});

const InputSchema = z.object({
  traits: TraitsSchema,
  interests: z.string().max(500).optional().default(""),
});

const OutputSchema = z.object({
  summary: z.string(),
  personality_type: z.string(),
  best_fit: z.array(
    z.object({
      slug: z.string(),
      course: z.string(),
      why: z.string(),
      fit_score: z.number(),
    }),
  ),
  consider: z.array(
    z.object({
      slug: z.string(),
      course: z.string(),
      why: z.string(),
    }),
  ),
  avoid: z.array(
    z.object({
      course: z.string(),
      why: z.string(),
    }),
  ),
  next_steps: z.array(z.string()),
});

export const analyzeMatchQuiz = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("openai/gpt-5");


    const { output } = await generateText({
      model,
      temperature: 0.5,
      system:
        "You are a Nigerian career counsellor for university aspirants. " +
        "Given trait scores (0-100) for a student, recommend Nigerian university courses they should consider. " +
        "Use real Nigerian course names. Slug must be lowercase-hyphenated (e.g. 'computer-science'). " +
        "fit_score is 0-100. Pick 5 best_fit, 3 consider, 2 avoid. Be empathetic and concrete.",
      prompt:
        `Trait scores: ${JSON.stringify(data.traits)}. ` +
        `Stated interests: ${data.interests || "not provided"}. ` +
        `Recommend Nigerian university courses that match.`,
      output: Output.object({ schema: OutputSchema }),
    });

    return output as z.infer<typeof OutputSchema>;
  });
