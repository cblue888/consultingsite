import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase secrets missing" });
  }

  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) return json(400, { error: "Missing token" });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("audit_reports")
    .select("id,submission_id,report_token,report_json,expires_at,created_at")
    .eq("report_token", token)
    .single();

  if (error || !data) {
    return json(404, { error: "Report not found" });
  }

  const { data: submission, error: submissionError } = await supabase
    .from("audit_submissions")
    .select("submission_mode,company_name,industry,employee_band")
    .eq("id", data.submission_id)
    .single();

  if (submissionError || !submission) {
    return json(404, { error: "Associated submission not found" });
  }

  const mode = submission?.submission_mode || "standard";
  const expiresAt = data.expires_at || null;

  if (mode === "guest" && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return json(410, { error: "This guest report has expired. Run another audit for a new report." });
  }

  return json(200, {
    report_token: data.report_token,
    submission_mode: mode,
    company_name: submission?.company_name || null,
    industry: submission?.industry || null,
    employee_band: submission?.employee_band || null,
    created_at: data.created_at,
    expires_at: expiresAt,
    report: data.report_json,
  });
});
