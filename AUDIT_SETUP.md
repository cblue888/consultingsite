# AI Ops Audit Setup

## 1) Run Supabase migration
Apply:
- `supabase/migrations/20260311_create_audit_tables.sql`

## 2) Deploy edge functions
Deploy:
- `supabase/functions/generate-audit-report/index.ts`
- `supabase/functions/get-audit-report/index.ts`

## 3) Set function secrets
Required secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Optional:
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `SITE_URL` (default: request origin)

## 4) Configure frontend runtime values
In both:
- `/audit/index.html`
- `/audit/results/index.html`

Set `window.BP_AUDIT_CONFIG` with:
- `supabaseUrl`
- `supabaseAnonKey`

Example:
```html
<script>
  window.BP_AUDIT_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
    functionBase: ""
  };
</script>
```

## 5) Routing
`vercel.json` includes rewrites for:
- `/audit`
- `/audit/results`
- `/audit/results/:token`

## 6) Validate flows
- Standard mode requires email and creates persistent links.
- Hidden guest mode allows no email and creates 24h links.
- Expired guest link returns a branded expired screen.
