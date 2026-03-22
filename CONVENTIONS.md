# InkBook Coding Conventions

## Stack
- Next.js 14+ App Router (NOT Pages Router)
- Supabase (Auth, PostgreSQL, Storage)
- Tailwind CSS + shadcn/ui (New York style, neutral)
- React Hook Form + Zod for forms
- TypeScript strict mode, pnpm

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL=https://oqawitvkwcbdsnevfygp.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXdpdHZrd2NiZHNuZXZmeWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzU3NjcsImV4cCI6MjA4OTcxMTc2N30.ucUGTkyUJ1yPMZtKC1o4k3pp_LSl6Cq6wbIDvBnFEyE
- SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXdpdHZrd2NiZHNuZXZmeWdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDEzNTc2NywiZXhwIjoyMDg5NzExNzY3fQ.rh7rRj1XPpVZRYZRUiSm1VjQ8SmAHodqNNvWI4XWWxc
- NEXT_PUBLIC_APP_URL=http://localhost:3000


## File Structure
- app/(auth)/ — Login, signup, callback
- app/(public)/ — Public pages (SSR, SEO, no auth)
- app/(dashboard)/ — Auth-protected admin pages
- app/api/ — API routes
- lib/supabase/ — Supabase client utilities
- lib/types/ — TypeScript types
- components/ui/ — shadcn (do not modify)
- components/shared/ — Custom reusable components

## Supabase Client Patterns
Server components and route handlers:
  Use createServerClient from @supabase/ssr with cookies from next/headers (await cookies()).

Client components:
  Use createBrowserClient from @supabase/ssr.

middleware.ts:
  Refresh session using createServerClient with request/response cookies.

## Rules
- Server Components by default. 'use client' only when needed.
- @/ path alias for all imports.
- All forms: React Hook Form + Zod.
- API routes: Zod validate, return { data } or { error }.
- Toasts: sonner. Icons: lucide-react. Dates: date-fns.
- Images: next/image. Loading: Skeleton. No 'any' types.
- Storage buckets: studio-assets (logos/covers), portfolio (tattoo images).
