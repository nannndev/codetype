# CodeType

## Dynamic GitHub snippets

The browser requests `/api/snippets?language=...`. The serverless route discovers popular repositories, filters generated/test/build files, extracts typing-sized snippets, and caches responses for six hours.

Create a fine-grained, read-only GitHub token and configure it only on the server or deployment platform:

```bash
GITHUB_TOKEN=github_pat_...
```

Never expose the token through a `VITE_` environment variable. Vite embeds those values in the public browser bundle.

On Vercel, add `GITHUB_TOKEN` under Project Settings -> Environment Variables. Use `vercel dev` when testing the serverless endpoint locally. Plain `npm run dev` remains usable and falls back to the curated public GitHub sources.

## Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/202608090001_initial_schema.sql` in the Supabase SQL Editor.
3. Copy the Project URL and publishable/anon key into `.env.local` using `.env.example`.
4. Enable GitHub under Authentication -> Providers.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; it must never use a `VITE_` prefix.
