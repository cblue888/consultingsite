import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type ResponseInput = {
  pillar_id: string;
  pillar_name?: string;
  question_id: string;
  statement: string;
  score_0_to_3: number;
};

type AuditPayload = {
  submission_mode: "standard" | "guest";
  company_name?: string;
  contact_name?: string;
  email?: string;
  industry: string;
  employee_band: string;
  website_url?: string;
  responses: ResponseInput[];
  utm?: Record<string, string>;
  source_page?: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PILLARS = [
  { id: "process_efficiency", name: "Process Efficiency" },
  { id: "system_integration", name: "System Integration" },
  { id: "doc_automation", name: "Document & Communication Automation" },
  { id: "data_reporting", name: "Data & Reporting Readiness" },
  { id: "ai_capacity", name: "AI Readiness & Team Capacity" },
];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function scoreToGrade(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function randomToken(size = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractPageContext(html: string) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const meta = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] || "").trim();
  const headingMatches = [...html.matchAll(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);

  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);

  return { title, meta_description: meta, headings: headingMatches, visible_text_sample: visible };
}

async function fetchWebsiteContext(rawUrl?: string) {
  if (!rawUrl) return null;
  const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "BluePixelAuditBot/1.0" },
    });

    clearTimeout(timeout);
    if (!res.ok) return { url: normalized, error: `Website fetch failed (${res.status})` };

    const text = await res.text();
    return { url: normalized, ...extractPageContext(text.slice(0, 200000)) };
  } catch (error) {
    return { url: normalized, error: String(error) };
  }
}

function groupResponses(responses: ResponseInput[]) {
  const grouped = new Map<string, ResponseInput[]>();
  for (const pillar of PILLARS) grouped.set(pillar.id, []);

  for (const item of responses) {
    if (!grouped.has(item.pillar_id)) continue;
    grouped.get(item.pillar_id)!.push(item);
  }

  return grouped;
}

function calculateScores(responses: ResponseInput[]) {
  const grouped = groupResponses(responses);

  const pillarScores = PILLARS.map((pillar) => {
    const items = grouped.get(pillar.id) ?? [];
    const total = items.reduce((sum, item) => sum + Number(item.score_0_to_3 || 0), 0);
    const max = items.length * 3;
    const score = max > 0 ? Math.round((total / max) * 100) : 0;
    return { pillar_id: pillar.id, name: pillar.name, score };
  });

  const overall = Math.round(
    pillarScores.reduce((sum, pillar) => sum + pillar.score, 0) / Math.max(1, pillarScores.length),
  );

  return {
    pillar_scores: pillarScores,
    overall_score: overall,
    letter_grade: scoreToGrade(overall),
  };
}

function fallbackReport(payload: AuditPayload, scores: ReturnType<typeof calculateScores>) {
  const weakPillars = [...scores.pillar_scores].sort((a, b) => a.score - b.score);
  const topGap = weakPillars[0];
  const nextGap = weakPillars[1] ?? weakPillars[0];

  const serviceTier = scores.overall_score < 55
    ? { tier: "System Build", price_range: "$15-30K", timeline: "4-8 weeks" }
    : scores.overall_score < 75
      ? { tier: "Quick Wins", price_range: "$5-10K", timeline: "2 weeks" }
      : { tier: "Ongoing Partner", price_range: "$5-8K/month", timeline: "60-90 days" };

  return {
    overall_score: scores.overall_score,
    letter_grade: scores.letter_grade,
    top_priority: `Stabilize ${topGap.name} first to remove immediate execution drag.`,
    competitive_risk:
      "Competitors with integrated workflows can respond faster, close faster, and scale without matching headcount.",
    pillars: scores.pillar_scores.map((pillar) => ({
      pillar_id: pillar.pillar_id,
      name: pillar.name,
      score: pillar.score,
      assessment:
        pillar.score >= 75
          ? "This area is relatively stable and can support further automation once integration dependencies are validated."
          : "This area is still heavily manual. Standardization and workflow ownership should be established before scaling automation.",
    })),
    action_plan: {
      fix_first: [
        {
          title: `Standardize ${topGap.name}`,
          description: "Create one owned workflow and remove duplicate handoffs.",
          pillar_id: topGap.pillar_id,
          pillar: topGap.name,
          impact: "High",
          effort: "Medium",
        },
        {
          title: "Define automation ownership",
          description: "Assign one internal owner accountable for AI ops rollout and reporting.",
          pillar_id: "ai_capacity",
          pillar: "AI Readiness & Team Capacity",
          impact: "High",
          effort: "Low",
        },
      ],
      fix_next: [
        {
          title: "Connect core systems",
          description: "Map data flow between CRM, scheduling, and accounting to eliminate re-entry.",
          pillar_id: "system_integration",
          pillar: "System Integration",
          impact: "High",
          effort: "Medium",
        },
        {
          title: `Harden ${nextGap.name}`,
          description: "Add operational checks and reporting to prevent workflow drift.",
          pillar_id: nextGap.pillar_id,
          pillar: nextGap.name,
          impact: "Medium",
          effort: "Medium",
        },
      ],
      leverage: [
        {
          title: "Launch one high-frequency automation",
          description: "Automate a daily repeating workflow with measurable cycle-time impact.",
          pillar_id: "doc_automation",
          pillar: "Document & Communication Automation",
          impact: "High",
          effort: "Medium",
        },
        {
          title: "Establish KPI operating cadence",
          description: "Review key pipeline and throughput metrics weekly to guide iteration.",
          pillar_id: "data_reporting",
          pillar: "Data & Reporting Readiness",
          impact: "Medium",
          effort: "Low",
        },
      ],
    },
    recommended_service: {
      ...serviceTier,
      why_fit: `Based on your current readiness profile, ${serviceTier.tier} is the best fit to deliver measurable operational wins quickly.`,
    },
    company_name: payload.company_name || "Guest Submission",
  };
}

async function generateNarrativeReport(payload: AuditPayload, scores: ReturnType<typeof calculateScores>, websiteContext: unknown) {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) throw new Error("Missing OPENAI_API_KEY secret");

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

  const systemPrompt =
    "You are an AI operations consultant analyzing a company's readiness for AI automation. " +
    "Return strict JSON only. Use the provided deterministic scores as anchors. " +
    "Be specific, practical, and industry-relevant. No markdown.";

  const userPayload = {
    company_name: payload.company_name,
    contact_name: payload.contact_name,
    industry: payload.industry,
    employee_band: payload.employee_band,
    website_url: payload.website_url,
    website_context: websiteContext,
    deterministic_scores: scores,
    responses: payload.responses,
    output_requirements: {
      pillars: "2-3 sentence assessment each",
      actions: "6-9 recommendations split across fix_first, fix_next, leverage",
      tags: "Each recommendation needs pillar_id, impact, effort",
      service_tiers: [
        "Quick Wins ($5-10K, 2 weeks)",
        "System Build ($15-30K, 4-8 weeks)",
        "Ongoing Partner ($5-8K/month)",
      ],
    },
    schema: {
      overall_score: 0,
      letter_grade: "A",
      top_priority: "",
      competitive_risk: "",
      pillars: [{ pillar_id: "", name: "", score: 0, assessment: "" }],
      action_plan: {
        fix_first: [{ title: "", description: "", pillar_id: "", pillar: "", impact: "High", effort: "Low" }],
        fix_next: [{ title: "", description: "", pillar_id: "", pillar: "", impact: "High", effort: "Low" }],
        leverage: [{ title: "", description: "", pillar_id: "", pillar: "", impact: "High", effort: "Low" }],
      },
      recommended_service: {
        tier: "",
        price_range: "",
        timeline: "",
        why_fit: "",
      },
    },
  };

  const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!completionRes.ok) {
    const err = await completionRes.text();
    throw new Error(`OpenAI request failed: ${completionRes.status} ${err}`);
  }

  const completion = await completionRes.json();
  const content = completion?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");

  const parsed = JSON.parse(content);
  parsed.overall_score = scores.overall_score;
  parsed.letter_grade = scores.letter_grade;

  if (!Array.isArray(parsed.pillars) || parsed.pillars.length === 0) {
    parsed.pillars = scores.pillar_scores.map((item) => ({
      pillar_id: item.pillar_id,
      name: item.name,
      score: item.score,
      assessment: "Assessment unavailable.",
    }));
  } else {
    parsed.pillars = parsed.pillars.map((item: any) => {
      const matched = scores.pillar_scores.find((p) => p.pillar_id === item.pillar_id || p.name === item.name);
      return {
        ...item,
        score: matched ? matched.score : Number(item.score || 0),
      };
    });
  }

  return parsed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase secrets missing" });
  }

  let payload: AuditPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON payload" });
  }

  const mode = payload.submission_mode === "guest" ? "guest" : "standard";
  const email = (payload.email || "").trim().toLowerCase();
  const companyName = (payload.company_name || "").trim();

  if (!payload.industry || !payload.employee_band) {
    return json(400, { error: "Industry and employee band are required" });
  }

  if (mode === "standard") {
    if (!email || !validEmail(email)) return json(400, { error: "Valid email is required for standard mode" });
    if (!companyName) return json(400, { error: "Company name is required for standard mode" });
  }

  if (!Array.isArray(payload.responses) || payload.responses.length < 10) {
    return json(400, { error: "Assessment responses are required" });
  }

  const sanitizedResponses = payload.responses.map((item) => ({
    ...item,
    score_0_to_3: Math.max(0, Math.min(3, Number(item.score_0_to_3))),
  }));

  const scores = calculateScores(sanitizedResponses);
  const websiteContext = await fetchWebsiteContext(payload.website_url);

  let report: any;
  let modelMeta: Record<string, unknown> = {};
  try {
    report = await generateNarrativeReport({ ...payload, responses: sanitizedResponses, submission_mode: mode }, scores, websiteContext);
    modelMeta = { provider: "openai", model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini" };
  } catch (error) {
    report = fallbackReport({ ...payload, responses: sanitizedResponses, submission_mode: mode }, scores);
    modelMeta = { provider: "fallback", reason: String(error) };
  }

  const expiresAt = mode === "guest" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
  const token = randomToken(24);

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: submission, error: submissionError } = await supabase
    .from("audit_submissions")
    .insert({
      submission_mode: mode,
      company_name: companyName || null,
      contact_name: payload.contact_name?.trim() || null,
      email: mode === "standard" ? email : null,
      industry: payload.industry,
      employee_band: payload.employee_band,
      website_url: payload.website_url?.trim() || null,
      responses_json: sanitizedResponses,
      source_page: payload.source_page || "audit",
      utm_json: payload.utm || {},
      expires_at: expiresAt,
      user_agent: req.headers.get("user-agent"),
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    return json(500, { error: `Failed to store submission: ${submissionError?.message || "unknown"}` });
  }

  const { error: reportError } = await supabase
    .from("audit_reports")
    .insert({
      submission_id: submission.id,
      report_token: token,
      overall_score: scores.overall_score,
      letter_grade: scores.letter_grade,
      pillar_scores_json: scores.pillar_scores,
      top_priority: report.top_priority || "No top priority generated.",
      competitive_risk: report.competitive_risk || "No competitive risk generated.",
      action_plan_json: report.action_plan || {},
      recommended_service_json: report.recommended_service || {},
      model_meta_json: {
        ...modelMeta,
        website_context_used: websiteContext,
      },
      report_json: report,
      expires_at: expiresAt,
    });

  if (reportError) {
    return json(500, { error: `Failed to store report: ${reportError.message}` });
  }

  const baseUrl = Deno.env.get("SITE_URL") || new URL(req.url).origin;

  return json(200, {
    report_token: token,
    submission_mode: mode,
    results_url: `${baseUrl}/audit/results/${token}`,
    expires_at: expiresAt,
  });
});
