# InkBook Architecture

## What This App Does
Multi-tenant SaaS for tattoo studios. Studios sign up, add artists, artists have portfolios. Public pages let clients browse and book appointments. Messaging via WhatsApp links.

## Database Schema (6 tables)

studios: id(uuid pk), owner_id(uuid refs auth.users), name(text), slug(text unique), description(text), address(text), city(text), phone(text), whatsapp_number(text), logo_url(text), cover_image_url(text), instagram_url(text), is_active(bool default true), created_at(timestamptz), updated_at(timestamptz)

artists: id(uuid pk), user_id(uuid refs auth.users nullable), studio_id(uuid refs studios on delete cascade), name(text), slug(text), bio(text), avatar_url(text), whatsapp_number(text), instagram_url(text), specialties(text[] default '{}'), is_active(bool default true), created_at(timestamptz), updated_at(timestamptz). UNIQUE(studio_id, slug)

portfolio_pieces: id(uuid pk), artist_id(uuid refs artists on delete cascade), image_url(text), thumbnail_url(text), title(text), description(text), styles(text[] default '{}'), body_part(text), is_featured(bool default false), sort_order(int default 0), created_at(timestamptz)

availability_rules: id(uuid pk), artist_id(uuid refs artists on delete cascade), day_of_week(smallint 0-6), start_time(time), end_time(time), slot_duration(int default 60), is_active(bool default true). CHECK(end_time > start_time)

availability_overrides: id(uuid pk), artist_id(uuid refs artists on delete cascade), date(date), is_blocked(bool default true), start_time(time), end_time(time), reason(text). UNIQUE(artist_id, date)

bookings: id(uuid pk), artist_id(uuid refs artists on delete cascade), studio_id(uuid refs studios on delete cascade), client_name(text), client_email(text), client_phone(text), date(date), start_time(time), end_time(time), description(text), placement(text), reference_urls(text[] default '{}'), estimated_size(text check in small/medium/large/full-sleeve), status(text default pending check in pending/confirmed/cancelled/completed/no_show), notes(text), created_at(timestamptz), updated_at(timestamptz)

## RLS Summary
- Studios: public SELECT where active, owner can INSERT/UPDATE/DELETE
- Artists: public SELECT where active, studio owner can INSERT/UPDATE/DELETE
- Portfolio: public SELECT, studio owner can INSERT/UPDATE/DELETE
- Availability: public SELECT, studio owner can ALL
- Bookings: anyone can INSERT, studio owner can SELECT/UPDATE, artist can SELECT own

## URL Structure
- / — Landing page
- /[studioSlug] — Public studio page
- /[studioSlug]/[artistSlug] — Public artist portfolio
- /[studioSlug]/[artistSlug]/book — Booking flow
- /login, /signup — Auth
- /dashboard/* — Protected admin area

## Storage
- Bucket "studio-assets" (public) — logos, covers. Path: {studio_id}/logo-{ts}.ext
- Bucket "portfolio" (public) — tattoo images. Path: {studio_id}/{artist_id}/{ts}.ext
