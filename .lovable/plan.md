## CourseCompass Nigeria — v1 Plan

A public, AI-powered web app that helps Nigerian students understand any university course, take a quick match test, and chat with an AI career assistant. No accounts in v1.

### Scope (3 of 6 modules)

1. **Course Intelligence Database** — AI-generated course profiles on demand, cached.
2. **Course Match Test** — 20-question psychometric quiz → recommended courses.
3. **AI Career Assistant** — streaming chat for course/career questions.

Out of scope for v1 (can ship later): soft-skills assessment, counsellor bookings, admin dashboard, user accounts.

### Pages / Routes

```text
/                       Landing — hero search, featured courses, CTAs to quiz + chat
/courses                Browse — search bar, popular course chips, recent profiles
/courses/$slug          Course profile (AI-generated, cached in DB)
/match                  Course Match Test (multi-step quiz + results)
/chat                   AI Career Assistant (single-session chat, no history)
/about                  Mission + how it works
```

Each route gets its own `head()` metadata.

### Course Profile content (rendered from AI JSON)

Tabs/sections on `/courses/$slug`:
- Overview (description, JAMB combo, O'level, duration, universities)
- Misconceptions vs Reality (table)
- Career Opportunities (traditional / remote / freelance / entrepreneurship)
- Salary Intelligence (entry → expert, NGN + international)
- Skills & Software Roadmap (essential / intermediate / advanced + tools)
- AI Impact (risk meter: very safe → high risk + AI tools to learn)
- Learning Resources (free courses, YouTube channels, certifications)
- 4-Year Roadmap (100L → final year activities, projects, internships)
- Industry Demand Index (scored bars)

If a profile isn't cached, show a "Generating your course profile…" state and stream/poll until ready.

### Course Match Test

- ~20 Likert questions across: analytical, creative, social, technical, entrepreneurial, leadership, communication, numerical.
- Score → send profile + raw scores to AI → returns top 5 best-fit and 3 worst-fit Nigerian courses with reasoning.
- Results page links to each course profile.
- Results stored in localStorage so user can revisit without re-taking.

### AI Career Assistant

- Single conversation per browser session, persisted in `localStorage` (per chat-agent-ui-contract: one conversation + localStorage).
- "New conversation" button clears it.
- System prompt scoped to Nigerian education, JAMB, university courses, careers, salaries — empathetic tone.

### Backend (Lovable Cloud)

Enable Lovable Cloud for:
- `course_profiles` table to cache AI-generated profiles (slug, title, data jsonb, created_at). Public SELECT, server-only INSERT.
- Server functions / TanStack server routes for AI calls (keep `LOVABLE_API_KEY` server-side).

Server endpoints:
- `POST /api/chat` — streaming AI Career Assistant (AI SDK `streamText` → `toUIMessageStreamResponse`).
- `generateCourseProfile` server fn — checks cache, otherwise calls Lovable AI Gateway with structured output (Zod schema) and writes to DB.
- `analyzeMatchQuiz` server fn — takes quiz scores, returns recommended courses (structured output).

Model: `google/gemini-3-flash-preview` via Lovable AI Gateway (`@ai-sdk/openai-compatible`).

### Design

- Palette: Midnight Indigo — `#0a0a1a` bg, `#141432` surface, `#1e1e5a` border, `#4f46e5` primary. Light text on dark.
- Typography: Outfit (headings) + Figtree (body), loaded via `<link>` in `__root.tsx`.
- Mobile-first, glassy surface cards, subtle indigo glow accents, gold-leaning highlight for stats (small accent only).
- All colors as semantic tokens in `src/styles.css` via `@theme inline`; update `:root` and `.dark` (default dark).

### Technical notes

- TanStack Start, file-based routes, no `src/pages/`.
- AI calls in `createServerFn` (one-shot: course profile gen, quiz analysis) and `/api/chat` server route (streaming).
- Structured output via AI SDK `Output.object` with compact Zod schemas (avoid Gemini "too many states").
- Cache strategy: slug-key lookup; if miss, generate + insert.
- React Query for profile fetch + cache; `useChat` from `@ai-sdk/react` for chat.

### Build order

1. Enable Lovable Cloud + migration for `course_profiles`.
2. Design tokens + fonts in `__root.tsx` and `src/styles.css`.
3. Root layout shell: nav + footer.
4. Landing page (`/`) with hero search, featured course chips, CTAs.
5. AI gateway helper (`src/lib/ai-gateway.server.ts`).
6. Course profile generation server fn + `/courses/$slug` page with all sections.
7. `/courses` browse page.
8. Match quiz pages + analysis server fn + results.
9. `/chat` page + `/api/chat` streaming route.
10. About page + polish, SEO meta on every route.

### Deferred for later phases

- Auth (Google + email) + saved progress
- Counsellor booking (Zoom/Calendar)
- Admin dashboard
- Soft-skills assessment module
- Full course-vs-course comparison engine
- Course profile caching warm-up for top 50 courses
