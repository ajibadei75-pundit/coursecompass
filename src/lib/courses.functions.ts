import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { slugify, titleFromSlug, type CourseProfile } from "./course-utils";

const InputSchema = z.object({ slug: z.string().min(1).max(80) });

// Compact schema to avoid Gemini "too many states"
const ProfileSchema = z.object({
  title: z.string(),
  faculty: z.string(),
  degree: z.string(),
  duration: z.string(),
  tagline: z.string(),
  overview: z.string(),
  jamb_subjects: z.array(z.string()),
  olevel_requirements: z.array(z.string()),
  universities: z.array(z.string()),
  related_courses: z.array(z.string()),
  misconceptions: z.array(z.object({ myth: z.string(), reality: z.string() })),
  career_opportunities: z.object({
    traditional: z.array(z.string()),
    remote: z.array(z.string()),
    freelance: z.array(z.string()),
    entrepreneurship: z.array(z.string()),
  }),
  salary: z.object({
    entry_ngn: z.string(),
    mid_ngn: z.string(),
    senior_ngn: z.string(),
    international_usd: z.string(),
  }),
  skills: z.object({
    essential: z.array(z.string()),
    intermediate: z.array(z.string()),
    advanced: z.array(z.string()),
  }),
  software: z.array(z.object({ name: z.string(), importance: z.string() })),
  ai_impact: z.object({
    risk: z.string(),
    summary: z.string(),
    tools_to_learn: z.array(z.string()),
  }),
  certifications: z.array(z.string()),
  youtube_channels: z.array(z.object({ name: z.string(), focus: z.string() })),
  roadmap: z.object({
    year_100: z.array(z.string()),
    year_200: z.array(z.string()),
    year_300: z.array(z.string()),
    year_400: z.array(z.string()),
    final_year: z.array(z.string()),
  }),
  projects: z.array(z.string()),
  demand_index: z.object({
    nigerian_demand: z.number(),
    global_demand: z.number(),
    salary_score: z.number(),
    entrepreneurship: z.number(),
    remote_friendly: z.number(),
    ai_resistance: z.number(),
    future_relevance: z.number(),
  }),
});

export const getCourseProfile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const slug = slugify(data.slug);
    if (!slug) throw new Error("Invalid course slug");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("course_profiles")
      .select("slug, title, data")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return { slug: existing.slug, title: existing.title, profile: existing.data as CourseProfile };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const courseName = titleFromSlug(slug);
    const gateway = createLovableAiGatewayProvider(key);
    const drafter = gateway("google/gemini-3-flash-preview");
    const verifier = gateway("openai/gpt-5");

    const systemPrompt =
      "You are a Nigerian university course expert, career counsellor and labor-market analyst. " +
      "Generate accurate, encouraging, Nigeria-specific course intelligence. " +
      "Salaries must be realistic Nigerian Naira ranges (e.g. '₦80,000 – ₦150,000 / month'). " +
      "Use real Nigerian universities (UI, UNILAG, OAU, UNN, ABU, FUTA, UNIBEN, UNILORIN, COOU, BUK, etc.). " +
      "Be concrete, never fluffy. 'AI risk' must be one of: 'Very Safe', 'Safe', 'Medium', 'High Risk'. " +
      "Software importance must be one of: 'Critical', 'Important', 'Useful'. " +
      "Demand index numbers are 0-100 integers.";

    // Pass 1 — Gemini drafts the profile (fast, broad)
    const { output: draft } = await generateText({
      model: drafter,
      temperature: 0.4,
      system: systemPrompt,
      prompt:
        `Build the complete CourseCompass profile for the course: "${courseName}". ` +
        `Treat this as a Nigerian undergraduate degree. Give 4-6 misconceptions vs realities, ` +
        `5-8 items in each list, and a 4-year + final-year roadmap students can actually follow. ` +
        `Keep tagline under 12 words.`,
      output: Output.object({ schema: ProfileSchema }),
    });

    // Pass 2 — GPT-5 fact-checks, corrects errors, tightens claims
    let profile = draft as CourseProfile;
    try {
      const { output: verified } = await generateText({
        model: verifier,
        temperature: 0.2,
        system:
          systemPrompt +
          " You are now a senior fact-checker. Review the draft course profile and return a corrected, " +
          "more accurate version. Fix unrealistic salaries, wrong universities, fake certifications, " +
          "outdated software, and any inaccurate JAMB subject combinations. Keep the same JSON schema.",
        prompt:
          `Course: "${courseName}".\n\nDraft profile (JSON):\n${JSON.stringify(draft)}\n\n` +
          `Return the corrected profile.`,
        output: Output.object({ schema: ProfileSchema }),
      });
      profile = verified as CourseProfile;
    } catch (err) {
      console.error("Verifier pass failed, using draft:", err);
    }


    await supabaseAdmin
      .from("course_profiles")
      .upsert({ slug, title: profile.title || courseName, data: profile as never }, { onConflict: "slug" });

    return { slug, title: profile.title || courseName, profile };
  });

export const listCachedCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("course_profiles")
    .select("slug, title, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as { slug: string; title: string; created_at: string }[];
});
