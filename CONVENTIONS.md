# InkBook Coding Conventions

## Stack
- Next.js 14+ App Router (NOT Pages Router)
- Supabase (Auth, PostgreSQL, Storage)
- Tailwind CSS + shadcn/ui (New York style, neutral)
- React Hook Form + Zod for forms
- TypeScript strict mode, pnpm

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- NEXT_PUBLIC_APP_URL

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
