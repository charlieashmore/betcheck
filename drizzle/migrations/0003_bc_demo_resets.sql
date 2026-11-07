CREATE TABLE public.bc_demo_resets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, reset_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.bc_demo_resets TO service_role;
ALTER TABLE public.bc_demo_resets ENABLE ROW LEVEL SECURITY;