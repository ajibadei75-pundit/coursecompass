
CREATE TABLE public.course_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX course_profiles_slug_idx ON public.course_profiles(slug);
GRANT SELECT ON public.course_profiles TO anon, authenticated;
GRANT ALL ON public.course_profiles TO service_role;
ALTER TABLE public.course_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course profiles are publicly readable"
  ON public.course_profiles FOR SELECT
  USING (true);
