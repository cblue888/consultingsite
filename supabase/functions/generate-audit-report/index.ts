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

type ScannedPage = {
  url: string;
  path: string;
  title: string;
  meta_description: string;
  headings: string[];
  summary_snippet: string;
  signals: {
    pricing_visible: boolean;
    booking_path_present: boolean;
    contact_form_present: boolean;
    social_proof_present: boolean;
    industry_content_present: boolean;
  };
};

type WebsiteScanContext = {
  root_url: string;
  pages_attempted: number;
  pages_scanned: number;
  pages: ScannedPage[];
  fetch_errors: string[];
  detected_signals: {
    pricing_visible: boolean;
    booking_path_present: boolean;
    contact_form_present: boolean;
    social_proof_present: boolean;
    industry_content_present: boolean;
  };
  opportunities: string[];
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

function gradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    A: "AI-Ready",
    B: "Strong",
    C: "Progressing",
    D: "Getting Started",
    F: "Not Ready",
  };
  return labels[grade] || "Not Assessed";
}

function buildExecutiveSummary(
  scores: ReturnType<typeof calculateScores>,
  companyName: string,
  industry: string,
  employeeBand: string,
): string {
  const name = companyName || "Your company";
  const readableIndustry = industry.replace(/_/g, " ");
  const weakest = [...scores.pillar_scores].sort((a, b) => a.score - b.score)[0];
  const strongest = [...scores.pillar_scores].sort((a, b) => b.score - a.score)[0];

  if (scores.overall_score >= 80) {
    return `${name} is well-positioned for AI-driven operations. As a ${readableIndustry} business with ${employeeBand} employees, your strongest area is ${strongest.name} (${strongest.score}/100). The primary opportunity is to move from strong foundations to automated execution, starting with ${weakest.name}.`;
  } else if (scores.overall_score >= 60) {
    return `${name} has meaningful operational foundations but significant gaps remain before AI automation will deliver reliable ROI. Your ${readableIndustry} operation scores highest in ${strongest.name} (${strongest.score}/100), but ${weakest.name} (${weakest.score}/100) is creating drag that will undermine automation efforts if not addressed first.`;
  } else if (scores.overall_score >= 40) {
    return `${name} is in the early stages of operational readiness for AI. Most workflows in your ${readableIndustry} business are still manual or inconsistent. ${weakest.name} (${weakest.score}/100) is the most critical gap. Without stabilizing core processes first, AI automation investments will produce unreliable results.`;
  } else {
    return `${name} is not yet ready for AI automation. Your ${readableIndustry} operation is heavily dependent on manual processes and tribal knowledge. ${weakest.name} scored ${weakest.score}/100, indicating fundamental workflow gaps. The immediate priority is process standardization before any automation investment.`;
  }
}

function fallbackPillarAssessment(pillarName: string, score: number, industry: string): string {
  const readableIndustry = industry.replace(/_/g, " ");
  if (score >= 75) {
    return `${pillarName} is your strongest operational area. Current processes are structured enough to support automation. Focus on connecting this strength to weaker pillars to maximize system-wide leverage.`;
  } else if (score >= 50) {
    return `${pillarName} shows partial structure but inconsistencies remain. Some workflows are repeatable, but gaps in standardization mean automation would produce mixed results. Solidify the process before layering AI on top.`;
  } else if (score >= 25) {
    return `${pillarName} is largely manual with minimal standardization. For a ${readableIndustry} business, this represents significant operational drag. Establishing consistent workflows here should be an early priority before considering automation.`;
  } else {
    return `${pillarName} is a critical gap. Processes are ad-hoc and dependent on individual knowledge. This will be the biggest bottleneck to any AI implementation. Start with documenting and standardizing the most frequent workflows.`;
  }
}

function randomToken(size = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeWebsiteUrl(rawUrl?: string): URL | null {
  if (!rawUrl?.trim()) return null;
  const candidate = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
  try {
    const parsed = new URL(candidate);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchHtml(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "BluePixelAuditAgent/1.0" },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }

    const text = await res.text();
    return { ok: true, status: res.status, text };
  } catch (error) {
    return { ok: false, error: String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function extractPageContext(html: string) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const meta = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] || "").trim();
  const headingMatches = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);

  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);

  return { title, meta_description: meta, headings: headingMatches, visible_text_sample: visible };
}

function extractInternalLinks(html: string, baseUrl: URL): string[] {
  const links = new Set<string>();
  const matches = html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi);

  for (const match of matches) {
    const href = (match[1] || "").trim();
    if (!href || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;

    try {
      const target = new URL(href, baseUrl);
      if (!/^https?:$/i.test(target.protocol)) continue;
      if (target.hostname !== baseUrl.hostname) continue;
      target.hash = "";
      links.add(target.toString());
    } catch {
      // ignore malformed links
    }
  }

  return [...links];
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

async function extractSitemapLinks(baseUrl: URL, limit = 20): Promise<string[]> {
  const visited = new Set<string>();
  const discovered = new Set<string>();
  const queue = [new URL("/sitemap.xml", baseUrl).toString()];

  while (queue.length && discovered.size < limit && visited.size < 5) {
    const sitemapUrl = queue.shift()!;
    if (visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    const res = await fetchHtml(sitemapUrl, 7000);
    if (!res.ok || !res.text) continue;

    const matches = res.text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi);
    for (const match of matches) {
      const raw = decodeXmlEntities((match[1] || "").trim());
      if (!raw) continue;

      try {
        const url = new URL(raw);
        if (!/^https?:$/i.test(url.protocol)) continue;
        if (url.hostname !== baseUrl.hostname) continue;

        // Handle sitemap indexes with nested XML files.
        if (/\.xml$/i.test(url.pathname)) {
          const child = url.toString();
          if (!visited.has(child) && queue.length < 4) queue.push(child);
          continue;
        }

        url.hash = "";
        discovered.add(url.toString());
        if (discovered.size >= limit) break;
      } catch {
        // ignore malformed loc entries
      }
    }
  }

  return [...discovered];
}

function linkPriority(url: string) {
  const path = new URL(url).pathname.toLowerCase();
  let score = 0;
  if (path === "/" || path === "") score += 100;
  if (/pricing|cost|plan/.test(path)) score += 45;
  if (/service|solution|offer/.test(path)) score += 42;
  if (/contact|book|schedule|consult/.test(path)) score += 38;
  if (/about|team|founder/.test(path)) score += 30;
  if (/case|result|testimonial/.test(path)) score += 26;
  if (/industry|vertical|construction|trade|accounting|medical|property|law|forestry/.test(path)) score += 24;
  if (/faq|question/.test(path)) score += 20;
  score -= path.length / 20;
  return score;
}

function detectPageSignals(html: string, context: ReturnType<typeof extractPageContext>) {
  const combined = `${context.title} ${context.meta_description} ${context.headings.join(" ")} ${context.visible_text_sample}`.toLowerCase();
  return {
    pricing_visible: /pricing|starting at|\$\s*\d+/.test(combined),
    booking_path_present: /calendly|book|schedule|strategy call|readiness call/.test(combined),
    contact_form_present: /<form\b/i.test(html) || /contact us|get in touch|request a call/.test(combined),
    social_proof_present: /testimonial|case stud|results|outcomes|clients/.test(combined),
    industry_content_present: /industry|vertical|construction|trades|accounting|property|medical|law|forestry|retail/.test(combined),
  };
}

function buildOpportunities(scan: WebsiteScanContext) {
  const opportunities: string[] = [];
  if (!scan.detected_signals.pricing_visible) {
    opportunities.push("Add a visible starting-price anchor so qualified buyers self-select faster.");
  }
  if (!scan.detected_signals.booking_path_present) {
    opportunities.push("Add one clear booking CTA above the fold and repeat it in at least two sections.");
  }
  if (!scan.detected_signals.contact_form_present) {
    opportunities.push("Add a short pre-qualification form to increase conversion quality from inbound traffic.");
  }
  if (!scan.detected_signals.social_proof_present) {
    opportunities.push("Add outcome-focused proof with metrics and timeframes to reduce buyer skepticism.");
  }
  if (!scan.detected_signals.industry_content_present) {
    opportunities.push("Create industry-specific pages that map your offer to operational pain by vertical.");
  }
  if (scan.pages_scanned < 3) {
    opportunities.push("Improve crawlable internal links so website agents can access more conversion-relevant pages.");
  }
  return opportunities.slice(0, 5);
}

function buildSiteScanSummary(scan: WebsiteScanContext | null) {
  if (!scan) return null;

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (scan.detected_signals.pricing_visible) strengths.push("Pricing or budget anchors are visible on public pages.");
  else gaps.push("No clear public pricing anchor was detected.");

  if (scan.detected_signals.booking_path_present) strengths.push("Booking or consultation pathways are visible.");
  else gaps.push("Booking CTA pathways are weak or inconsistent.");

  if (scan.detected_signals.contact_form_present) strengths.push("At least one contact or intake form is present.");
  else gaps.push("No clear contact form was detected on scanned pages.");

  if (scan.detected_signals.social_proof_present) strengths.push("Proof elements like testimonials, outcomes, or case references are present.");
  else gaps.push("Social proof is limited or hard to discover.");

  if (scan.detected_signals.industry_content_present) strengths.push("Industry-specific positioning is visible.");
  else gaps.push("Industry-specific messaging is limited.");

  const pagesReviewed = scan.pages.slice(0, 5).map((page) => ({
    url: page.url,
    why_it_matters: page.path === "/"
      ? "Homepage positioning and primary conversion path"
      : page.path.includes("pricing")
        ? "Budget qualification and offer transparency"
        : page.path.includes("service") || page.path.includes("solution")
          ? "Service clarity and solution mapping"
          : page.path.includes("about")
            ? "Credibility and operator trust signals"
            : "Conversion path and relevance signals",
  }));

  return {
    overview: `Agent scan reviewed ${scan.pages_scanned}/${scan.pages_attempted} public pages from ${scan.root_url}.`,
    pages_reviewed: pagesReviewed,
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 4),
    quick_wins: scan.opportunities.slice(0, 4),
  };
}

async function scanWebsiteWithAgent(rawUrl?: string): Promise<WebsiteScanContext | null> {
  const base = normalizeWebsiteUrl(rawUrl);
  if (!base) return null;

  const homepageUrl = base.toString();
  const homepageRes = await fetchHtml(homepageUrl, 9000);

  if (!homepageRes.ok || !homepageRes.text) {
    return {
      root_url: base.origin,
      pages_attempted: 1,
      pages_scanned: 0,
      pages: [],
      fetch_errors: [`${homepageUrl} (${homepageRes.error || "unknown error"})`],
      detected_signals: {
        pricing_visible: false,
        booking_path_present: false,
        contact_form_present: false,
        social_proof_present: false,
        industry_content_present: false,
      },
      opportunities: ["Website could not be fully scanned. Verify URL and public page accessibility."],
    };
  }

  const homepageContext = extractPageContext(homepageRes.text);
  const homepageSignals = detectPageSignals(homepageRes.text, homepageContext);

  const sitemapLinks = await extractSitemapLinks(base, 20);
  const probeLinks = [
    "/pricing",
    "/services",
    "/solutions",
    "/about",
    "/contact",
    "/book",
    "/growth",
    "/audit",
  ].map((path) => new URL(path, base).toString());

  const internalLinks = [...new Set([
    ...extractInternalLinks(homepageRes.text, base),
    ...sitemapLinks,
    ...probeLinks,
  ])]
    .filter((url) => url !== homepageUrl)
    .sort((a, b) => linkPriority(b) - linkPriority(a))
    .slice(0, 6);

  const results = await Promise.all(internalLinks.map(async (url) => {
    const res = await fetchHtml(url, 7500);
    if (!res.ok || !res.text) return { url, error: res.error || "fetch failed" };
    const context = extractPageContext(res.text);
    return {
      url,
      path: new URL(url).pathname || "/",
      title: context.title,
      meta_description: context.meta_description,
      headings: context.headings.slice(0, 4),
      summary_snippet: context.visible_text_sample.slice(0, 350),
      signals: detectPageSignals(res.text, context),
    };
  }));

  const pages: ScannedPage[] = [
    {
      url: homepageUrl,
      path: base.pathname || "/",
      title: homepageContext.title,
      meta_description: homepageContext.meta_description,
      headings: homepageContext.headings.slice(0, 4),
      summary_snippet: homepageContext.visible_text_sample.slice(0, 350),
      signals: homepageSignals,
    },
    ...results.filter((item: any) => !item.error) as ScannedPage[],
  ];

  const errors = results.filter((item: any) => item.error).map((item: any) => `${item.url} (${item.error})`);

  const detectedSignals = pages.reduce(
    (acc, page) => ({
      pricing_visible: acc.pricing_visible || page.signals.pricing_visible,
      booking_path_present: acc.booking_path_present || page.signals.booking_path_present,
      contact_form_present: acc.contact_form_present || page.signals.contact_form_present,
      social_proof_present: acc.social_proof_present || page.signals.social_proof_present,
      industry_content_present: acc.industry_content_present || page.signals.industry_content_present,
    }),
    {
      pricing_visible: false,
      booking_path_present: false,
      contact_form_present: false,
      social_proof_present: false,
      industry_content_present: false,
    },
  );

  const scan: WebsiteScanContext = {
    root_url: base.origin,
    pages_attempted: 1 + internalLinks.length,
    pages_scanned: pages.length,
    pages,
    fetch_errors: errors,
    detected_signals: detectedSignals,
    opportunities: [],
  };

  scan.opportunities = buildOpportunities(scan);
  return scan;
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

function fallbackReport(
  payload: AuditPayload,
  scores: ReturnType<typeof calculateScores>,
  websiteScan: WebsiteScanContext | null,
) {
  const weakPillars = [...scores.pillar_scores].sort((a, b) => a.score - b.score);
  const topGap = weakPillars[0];
  const nextGap = weakPillars[1] ?? weakPillars[0];

  const serviceTier = scores.overall_score < 55
    ? { tier: "System Build", price_range: "$15-30K", timeline: "4-8 weeks" }
    : scores.overall_score < 75
      ? { tier: "Quick Wins", price_range: "$5-10K", timeline: "2 weeks" }
      : { tier: "Ongoing Partner", price_range: "$5-8K/month", timeline: "60-90 days" };

  const readableIndustry = payload.industry.replace(/_/g, " ");

  return {
    overall_score: scores.overall_score,
    letter_grade: scores.letter_grade,
    grade_label: gradeLabel(scores.letter_grade),
    executive_summary: buildExecutiveSummary(scores, payload.company_name || "", payload.industry, payload.employee_band),
    top_priority: `Stabilize ${topGap.name} first — at ${topGap.score}/100, this is creating the most operational drag and will undermine automation investments if left unaddressed.`,
    competitive_risk: `In ${readableIndustry}, competitors with integrated workflows can respond ${scores.overall_score < 50 ? "2-3x" : "significantly"} faster, close deals with less friction, and scale without matching headcount. Every month of manual operations widens this gap.`,
    site_scan_summary: buildSiteScanSummary(websiteScan),
    pillars: scores.pillar_scores.map((pillar) => ({
      pillar_id: pillar.pillar_id,
      name: pillar.name,
      score: pillar.score,
      assessment: fallbackPillarAssessment(pillar.name, pillar.score, payload.industry),
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

async function generateNarrativeReport(
  payload: AuditPayload,
  scores: ReturnType<typeof calculateScores>,
  websiteScan: WebsiteScanContext | null,
) {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) throw new Error("Missing OPENAI_API_KEY secret");

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

  const systemPrompt =
    "You are an expert AI operations consultant producing a company-specific readiness report. " +
    "Your audience is the business owner/operator. Be direct and specific — reference their industry, " +
    "their survey answers, and their website scan findings by name. Avoid generic advice. " +
    "Every pillar assessment MUST reference at least one specific detail from the survey responses " +
    "or website scan. For example, if they scored 0 on scheduling, say so explicitly. " +
    "The executive_summary should name the company, their industry, and their weakest pillar. " +
    "The competitive_risk should reference their specific industry, not be generic. " +
    "Return strict JSON matching the schema. No markdown, no preamble.";

  const userPayload = {
    company_name: payload.company_name,
    contact_name: payload.contact_name,
    industry: payload.industry,
    employee_band: payload.employee_band,
    website_url: payload.website_url,
    website_agent_scan: websiteScan,
    deterministic_scores: scores,
    responses: payload.responses,
    output_requirements: {
      executive_summary: "2-3 sentences contextualizing the overall score for this specific company, industry, and size. Reference the weakest pillar by name and score.",
      grade_label: "One of: Not Ready, Getting Started, Progressing, Strong, AI-Ready",
      pillars: "2-3 sentence assessment each. MUST reference specific survey answers or scan findings. Never use generic language like 'this area needs improvement'.",
      actions: "6-9 recommendations split across fix_first (2-3), fix_next (2-3), leverage (2-3). Each must be specific to this company's industry and gaps.",
      tags: "Each recommendation needs pillar_id, pillar (name), impact (High/Medium/Low), effort (High/Medium/Low)",
      site_scan_summary: "Include overview, pages_reviewed (2-5 with why_it_matters), strengths, gaps, and quick_wins",
      service_tiers: [
        "Quick Wins ($5-10K, 2 weeks)",
        "System Build ($15-30K, 4-8 weeks)",
        "Ongoing Partner ($5-8K/month)",
      ],
    },
    schema: {
      overall_score: 0,
      letter_grade: "A",
      grade_label: "AI-Ready",
      executive_summary: "",
      top_priority: "",
      competitive_risk: "",
      site_scan_summary: {
        overview: "",
        pages_reviewed: [{ url: "", why_it_matters: "" }],
        strengths: [""],
        gaps: [""],
        quick_wins: [""],
      },
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

  // Enforce new fields with deterministic fallbacks
  if (!parsed.grade_label) {
    parsed.grade_label = gradeLabel(scores.letter_grade);
  }
  if (!parsed.executive_summary || typeof parsed.executive_summary !== "string") {
    parsed.executive_summary = buildExecutiveSummary(
      scores,
      payload.company_name || "",
      payload.industry,
      payload.employee_band,
    );
  }

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

  if (!parsed.site_scan_summary || typeof parsed.site_scan_summary !== "object") {
    parsed.site_scan_summary = buildSiteScanSummary(websiteScan);
  } else {
    parsed.site_scan_summary.pages_reviewed = Array.isArray(parsed.site_scan_summary.pages_reviewed)
      ? parsed.site_scan_summary.pages_reviewed.slice(0, 5)
      : [];
    parsed.site_scan_summary.strengths = Array.isArray(parsed.site_scan_summary.strengths)
      ? parsed.site_scan_summary.strengths.slice(0, 5)
      : [];
    parsed.site_scan_summary.gaps = Array.isArray(parsed.site_scan_summary.gaps)
      ? parsed.site_scan_summary.gaps.slice(0, 5)
      : [];
    parsed.site_scan_summary.quick_wins = Array.isArray(parsed.site_scan_summary.quick_wins)
      ? parsed.site_scan_summary.quick_wins.slice(0, 5)
      : [];
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
  const websiteScan = await scanWebsiteWithAgent(payload.website_url);

  let report: any;
  let modelMeta: Record<string, unknown> = {};
  try {
    report = await generateNarrativeReport({ ...payload, responses: sanitizedResponses, submission_mode: mode }, scores, websiteScan);
    modelMeta = { provider: "openai", model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini" };
  } catch (error) {
    report = fallbackReport({ ...payload, responses: sanitizedResponses, submission_mode: mode }, scores, websiteScan);
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
        website_context_used: websiteScan,
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
