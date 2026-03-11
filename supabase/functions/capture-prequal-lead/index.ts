import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PrequalPayload = {
  company_name?: string;
  industry?: string;
  employee_band?: string;
  bottleneck?: string;
  source_page?: string;
  utm?: Record<string, string>;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase secrets missing" });
  }

  let payload: PrequalPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON payload" });
  }

  const companyName = String(payload.company_name || "").trim();
  const industry = String(payload.industry || "").trim();
  const employeeBand = String(payload.employee_band || "").trim();
  const bottleneck = String(payload.bottleneck || "").trim();

  if (!companyName || !industry || !employeeBand || !bottleneck) {
    return json(400, { error: "Company, industry, employee band, and bottleneck are required" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { error } = await supabase
    .from("prequal_leads")
    .insert({
      company_name: companyName,
      industry,
      employee_band: employeeBand,
      bottleneck,
      source_page: payload.source_page || "homepage",
      utm_json: payload.utm || {},
      user_agent: req.headers.get("user-agent"),
    });

  if (error) {
    return json(500, { error: `Failed to store pre-qualification lead: ${error.message}` });
  }

  return json(200, { ok: true });
});
