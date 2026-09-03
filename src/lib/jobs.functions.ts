import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  course: z.string().min(2).max(120),
  profession: z.string().max(100).default(""),
  skills: z.array(z.string().max(40)).max(15).default([]),
  location: z.string().max(80).default("Nigeria"),
  remoteOnly: z.boolean().default(false),
  quiet: z.boolean().default(false),
});

export const searchJobsForCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit } = await import("./rate-limit.server");
    enforceRateLimit(getRequest(), "job-search", {
      limit: data.quiet ? 40 : 20,
      windowMs: 600_000,
    });

    const { aggregateJobs, scoreJobs } = await import("./jobs.server");
    const { fallbackRoles } = await import("./jobs-utils");

    let roles = data.profession.trim()
      ? [data.profession.trim(), ...fallbackRoles(data.course)]
      : fallbackRoles(data.course);
    let notice: string | undefined;

    if (!data.quiet) {
      try {
        const { generateText, Output } = await import("ai");
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY ?? "", undefined, {
          structuredOutputs: true,
        });
        const { output } = await generateText({
          model: gateway("google/gemini-flash-lite-latest"),
          system:
            "You map Nigerian university courses, a target profession, and extra skills to realistic job titles used in Nigeria and remote roles available to Nigerians. " +
            "Prioritize the target profession, then course-aligned roles. Return 6 concrete, searchable job titles (no seniority fluff), ordered by best fit.",
          prompt: `Course: ${data.course}. Target profession: ${data.profession || "not specified"}. Extra skills: ${data.skills.join(", ") || "none"}. Preferred location: ${data.location || "Nigeria / remote"}.`,
          output: Output.object({ schema: z.object({ roles: z.array(z.string()).min(3).max(8) }) }),
        });
        const ai = (output as { roles: string[] }).roles.filter(Boolean);
        if (ai.length) roles = data.profession.trim() ? [data.profession.trim(), ...ai] : ai;
      } catch {
        notice = "Using our built-in course→role map (AI matcher unavailable right now).";
      }
    }

    const pool = await aggregateJobs(roles, data.skills, data.location);
    const jobs = scoreJobs(pool, roles, data.skills, data.location, data.remoteOnly);

    const counts = new Map<string, number>();
    for (const j of jobs) counts.set(j.source, (counts.get(j.source) ?? 0) + 1);

    return {
      roles,
      profession: data.profession,
      keywords: [...roles, ...data.skills],
      jobs,
      fetchedAt: new Date().toISOString(),
      sources: [...counts.entries()].map(([name, count]) => ({ name, count })) as {
        name: import("./jobs-utils").JobSource;
        count: number;
      }[],
      notice: jobs.length ? notice : notice ?? "No live matches right now — try the platform links below.",
    };
  });
