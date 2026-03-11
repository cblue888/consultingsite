(function () {
  var CONFIG = window.BP_AUDIT_CONFIG || {};
  var SCORE_LABELS = ["Not at all", "Somewhat", "Mostly", "Completely"];
  var PILLARS = [
    { id: "process_efficiency", name: "Process Efficiency" },
    { id: "system_integration", name: "System Integration" },
    { id: "doc_automation", name: "Document & Communication Automation" },
    { id: "data_reporting", name: "Data & Reporting Readiness" },
    { id: "ai_capacity", name: "AI Readiness & Team Capacity" }
  ];

  var BASE_QUESTIONS = {
    process_efficiency: [
      "Our quoting/estimating process is standardized and takes under 30 minutes.",
      "Customer/client intake and onboarding runs without manual follow-up.",
      "Scheduling and dispatch happens without phone calls or spreadsheets."
    ],
    system_integration: [
      "Our CRM, accounting, and scheduling systems share data automatically.",
      "Customer information lives in one place, not across spreadsheets and email.",
      "We can pull a report on any key metric in under 5 minutes."
    ],
    doc_automation: [
      "Invoices, quotes, and reports are generated automatically from our systems.",
      "Client follow-ups and reminders happen without someone manually sending them.",
      "Document collection from clients/vendors does not require repeated chasing."
    ],
    data_reporting: [
      "We have clean, structured data on our customers, jobs, and financials.",
      "Our team makes decisions based on dashboards or reports, not gut feel.",
      "We could hand our data to a developer and they could build on it immediately."
    ],
    ai_capacity: [
      "Our team is open to adopting new tools and workflows.",
      "We have someone internally who could own an AI implementation.",
      "Leadership has discussed or budgeted for AI/automation initiatives."
    ]
  };

  var INDUSTRY_QUESTIONS = {
    accounting_firms: {
      process_efficiency: [
        "New client intake is standardized and does not require repeated back-and-forth.",
        "Engagement setup (letters, checklists, kickoff) can be completed quickly.",
        "Busy-season file handoffs across team members happen without manual chasing."
      ],
      system_integration: [
        "Tax, document, and communication systems share status updates automatically.",
        "Client records are centralized instead of scattered across email and spreadsheets.",
        "Partners can see real-time file and deadline status in minutes."
      ],
      doc_automation: [
        "Document requests and reminders are sent automatically until completion.",
        "Engagement letters and recurring templates are generated from intake data.",
        "Client status updates can be sent without manual drafting every time."
      ],
      data_reporting: [
        "We can quickly identify at-risk files before key tax deadlines.",
        "Capacity and workflow reporting is visible across offices or teams.",
        "Our operational data is structured enough to automate busy-season reporting."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    construction: {
      process_efficiency: [
        "Subcontractor coordination is structured and does not rely on daily phone fire drills.",
        "Change order creation and approvals move quickly through a repeatable process.",
        "Project status updates to clients can be sent without PM manual effort."
      ],
      system_integration: [
        "Bids, schedules, and job financials stay in sync across tools.",
        "Field updates and office workflows share the same source of truth.",
        "We can pull project risk and schedule reports in under 5 minutes."
      ],
      doc_automation: [
        "Change orders, RFIs, and site documentation can be drafted automatically.",
        "Subcontractor reminders and confirmations are automated.",
        "Safety incident data can be captured and formatted without manual re-entry."
      ],
      data_reporting: [
        "Project milestones and delays are tracked in structured, reportable data.",
        "Leadership decisions are based on live project reporting, not only calls and meetings.",
        "Our project data quality is good enough to automate coordination workflows."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    medical_clinics: {
      process_efficiency: [
        "Patient intake and onboarding are standardized before arrival.",
        "Insurance and eligibility checks are completed without morning bottlenecks.",
        "Cancellation and waitlist workflows run without manual back-and-forth."
      ],
      system_integration: [
        "Scheduling, billing, and patient communication data stays synchronized.",
        "Patient records are not fragmented across inboxes, notes, and spreadsheets.",
        "Clinic operations metrics can be reported quickly and consistently."
      ],
      doc_automation: [
        "Patient reminders and follow-ups are automated.",
        "Referral tracking and status updates do not depend on manual inbox management.",
        "Recurring forms and patient communications can be generated from system data."
      ],
      data_reporting: [
        "No-show, recall, and intake performance data is clean and reportable.",
        "Operational decisions rely on reporting, not only staff memory.",
        "Our data is structured enough for compliant automation implementation."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    property_management: {
      process_efficiency: [
        "Maintenance requests are triaged and dispatched through a consistent workflow.",
        "Tenant and owner communications are handled through repeatable processes.",
        "Lease renewal timelines are tracked proactively, not reactively."
      ],
      system_integration: [
        "Portfolio, maintenance, and communication systems exchange data automatically.",
        "Tenant and owner information is centralized in one place.",
        "We can produce operational reports for portfolio health in under 5 minutes."
      ],
      doc_automation: [
        "Owner reports can be generated from property data with minimal manual assembly.",
        "Tenant acknowledgments and status updates can run automatically.",
        "AGM and compliance document preparation can be templated and automated."
      ],
      data_reporting: [
        "Maintenance, renewals, and vacancy metrics are clean and structured.",
        "Leadership decisions are informed by regular reporting across properties.",
        "Our portfolio data is implementation-ready for workflow automation."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    trades: {
      process_efficiency: [
        "Quotes are turned around quickly through a standard process.",
        "Job scheduling avoids double-bookings and dead time.",
        "Post-job invoicing and follow-up happens without delays."
      ],
      system_integration: [
        "Lead, dispatch, and invoicing data flows across systems automatically.",
        "Customer and job history is centralized and easy to access.",
        "We can report quote conversion, job throughput, and cash collection quickly."
      ],
      doc_automation: [
        "Quotes and invoices can be generated from job intake data.",
        "Customer confirmations, reminders, and review requests run automatically.",
        "Cold quote follow-up can run in sequence without manual chasing."
      ],
      data_reporting: [
        "We have structured data on leads, jobs, invoices, and repeat customers.",
        "Operational decisions are backed by simple reporting instead of gut feel.",
        "Our data quality is strong enough to automate growth workflows."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    law_firms: {
      process_efficiency: [
        "Client intake, conflicts checks, and engagement setup follow a standard workflow.",
        "Document assembly for recurring matter types is efficient and repeatable.",
        "Critical deadlines are tracked with clear ownership and escalation."
      ],
      system_integration: [
        "Matter, document, and billing systems share status data automatically.",
        "Client and matter information is centralized rather than fragmented.",
        "Partners can retrieve operational and deadline metrics quickly."
      ],
      doc_automation: [
        "Engagement letters and recurring legal document drafts can be generated from intake.",
        "Client updates and reminders can be automated for routine milestones.",
        "Document-heavy workflows (like due diligence prep) are pre-structured for automation."
      ],
      data_reporting: [
        "Matter status, deadlines, and utilization data is clean and structured.",
        "Operational planning decisions rely on reporting, not memory.",
        "Our data could be handed to a developer and used immediately."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    forestry_logging: {
      process_efficiency: [
        "Field-to-office workflow for harvest and compliance data is standardized.",
        "Crew scheduling across sites runs on a repeatable process.",
        "Equipment service tracking is proactive, not reactive after failures."
      ],
      system_integration: [
        "Field data, scheduling, and reporting systems sync automatically.",
        "Operational and compliance information is centralized and accessible.",
        "We can pull key operations and compliance metrics quickly when needed."
      ],
      doc_automation: [
        "Compliance and stewardship reporting can be generated from field inputs.",
        "Crew dispatch updates and confirmations can be automated.",
        "Timber cruise and volume reporting does not require extensive manual compilation."
      ],
      data_reporting: [
        "Field and office data is clean enough for audit-ready reporting.",
        "Leadership decisions are informed by regular operational dashboards.",
        "Our data can support automation buildouts without major cleanup first."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    }
  };

  var INDUSTRY_OPTIONS = [
    { value: "accounting_firms", label: "Accounting Firms" },
    { value: "construction", label: "Construction" },
    { value: "medical_clinics", label: "Medical Clinics" },
    { value: "property_management", label: "Property Management" },
    { value: "trades", label: "Trades (HVAC, Electrical, Plumbing, etc.)" },
    { value: "law_firms", label: "Law Firms" },
    { value: "forestry_logging", label: "Forestry and Logging" }
  ];

  function $(sel) { return document.querySelector(sel); }

  function normalizeUrl(v) {
    if (!v) return "";
    var trimmed = v.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return "https://" + trimmed;
  }

  function selectedOpt(current, value) { return current === value ? " selected" : ""; }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getQuestionSet(industry) {
    var specific = INDUSTRY_QUESTIONS[industry];
    if (!specific) return BASE_QUESTIONS;
    var merged = {};
    PILLARS.forEach(function (pillar) { merged[pillar.id] = specific[pillar.id] || BASE_QUESTIONS[pillar.id]; });
    return merged;
  }

  function getActiveQuestions(questionSet, pillarId) {
    return (questionSet[pillarId] || BASE_QUESTIONS[pillarId] || []).slice(0, 2);
  }

  function initAuditPage() {
    var root = $("[data-audit-app]");
    if (!root) return;

    var state = {
      step: 0,
      mode: "standard",
      processing: false,
      error: "",
      form: {
        company_name: "",
        contact_name: "",
        email: "",
        industry: "",
        employee_band: "",
        website_url: ""
      },
      responses: {}
    };

    function totalSteps() { return PILLARS.length + 1; }
    function progressPct() { return Math.round(((state.step + 1) / totalSteps()) * 100); }

    function collectAttribution() {
      var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "wbraid", "gbraid", "msclkid", "fbclid"];
      var out = {};
      var params = new URLSearchParams(window.location.search);
      keys.forEach(function (k) { var v = params.get(k); if (v) out[k] = v; });
      return out;
    }

    function validateCurrentStep() {
      state.error = "";
      if (state.step === 0) {
        if (state.mode === "standard" && !state.form.email.trim()) {
          state.error = "Email is required for a persistent report link.";
          return false;
        }
        if (state.mode === "standard" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.form.email.trim())) {
          state.error = "Enter a valid email address.";
          return false;
        }
        if (!state.form.industry) {
          state.error = "Select your industry.";
          return false;
        }
        if (!state.form.employee_band) {
          state.error = "Select your employee range.";
          return false;
        }
        if (state.mode === "standard" && !state.form.company_name.trim()) {
          state.error = "Company name is required for standard reports.";
          return false;
        }
        return true;
      }

      var pillar = PILLARS[state.step - 1];
      var questionCount = getActiveQuestions(getQuestionSet(state.form.industry || ""), pillar.id).length;
      var answers = state.responses[pillar.id] || [];
      if (answers.length < questionCount || answers.slice(0, questionCount).some(function (n) { return typeof n !== "number"; })) {
        state.error = "Answer all statements before continuing.";
        return false;
      }
      return true;
    }

    function renderDetailsStep(container) {
      var industryOptions = INDUSTRY_OPTIONS.map(function (it) {
        var selected = state.form.industry === it.value ? " selected" : "";
        return '<option value="' + it.value + '"' + selected + '>' + it.label + '</option>';
      }).join("");

      container.innerHTML =
        '<p class="step-tag">Step 1 of ' + totalSteps() + '</p>' +
        '<h2 class="step-title">FREE AI Ops Audit</h2>' +
        '<p class="step-sub">Quick profile first. Then five short pillars. We also scan your website to personalize the report.</p>' +
        '<div class="form-grid">' +
        '  <div class="field"><label for="company_name">Company name</label><input id="company_name" name="company_name" value="' + escapeHtml(state.form.company_name) + '" placeholder="Blue Pixel Consulting"></div>' +
        '  <div class="field"><label for="contact_name">Your name</label><input id="contact_name" name="contact_name" value="' + escapeHtml(state.form.contact_name) + '" placeholder="Casey"></div>' +
        '  <div class="field full"><label for="email">Email' + (state.mode === "standard" ? "*" : "") + '</label><input id="email" type="email" name="email" value="' + escapeHtml(state.form.email) + '" placeholder="you@company.com" ' + (state.mode === "standard" ? "required" : "") + '><div class="helper">Email saves your report and lets us send a persistent link. Guest mode works without email.</div><button type="button" class="guest-toggle" data-guest-toggle aria-label="Toggle guest mode">' + (state.mode === "standard" ? "Prefer not to share email?" : "Use standard mode instead") + '</button>' + (state.mode === "guest" ? '<div class="guest-note">Guest mode enabled. Report link is visible in-app and expires in 24 hours.</div>' : '') + '</div>' +
        '  <div class="field"><label for="industry">Industry*</label><select id="industry" name="industry"><option value="">Select industry</option>' + industryOptions + '</select></div>' +
        '  <div class="field"><label for="employee_band">Employees*</label><select id="employee_band" name="employee_band"><option value="">Select range</option><option value="10-25"' + selectedOpt(state.form.employee_band, "10-25") + '>10-25</option><option value="25-50"' + selectedOpt(state.form.employee_band, "25-50") + '>25-50</option><option value="50-100"' + selectedOpt(state.form.employee_band, "50-100") + '>50-100</option><option value="100-250"' + selectedOpt(state.form.employee_band, "100-250") + '>100-250</option><option value="250+"' + selectedOpt(state.form.employee_band, "250+") + '>250+</option></select></div>' +
        '  <div class="field full"><label for="website_url">Company website</label><input id="website_url" name="website_url" value="' + escapeHtml(state.form.website_url) + '" placeholder="https://yourcompany.com"><div class="helper">We use homepage content to personalize recommendations.</div></div>' +
        '</div>';

      container.querySelectorAll("input, select").forEach(function (el) {
        el.addEventListener("input", function () { state.form[el.name] = el.value; });
      });

      var toggle = container.querySelector("[data-guest-toggle]");
      if (toggle) {
        toggle.addEventListener("click", function () {
          state.mode = state.mode === "standard" ? "guest" : "standard";
          if (state.mode === "guest") state.form.email = "";
          render();
        });
      }
    }

    function renderPillarStep(container) {
      var pillar = PILLARS[state.step - 1];
      var questions = getActiveQuestions(getQuestionSet(state.form.industry || ""), pillar.id);
      var answers = state.responses[pillar.id] || [];

      var questionHtml = questions.map(function (question, idx) {
        var radios = SCORE_LABELS.map(function (label, score) {
          var checked = answers[idx] === score ? " checked" : "";
          return '<label><input type="radio" name="' + pillar.id + '_' + idx + '" value="' + score + '"' + checked + '><span class="scale-option">' + label + ' (' + score + ')</span></label>';
        }).join("");

        return '<div class="question"><p class="question-title">' + escapeHtml(question) + '</p><div class="scale" data-qidx="' + idx + '">' + radios + '</div></div>';
      }).join("");

      container.innerHTML =
        '<p class="step-tag">Step ' + (state.step + 1) + ' of ' + totalSteps() + '</p>' +
        '<h2 class="step-title">' + pillar.name + '</h2>' +
        '<p class="step-sub">Rate each statement from Not at all (0) to Completely (3).</p>' +
        '<div class="question-list">' + questionHtml + '</div>';

      container.querySelectorAll(".scale input").forEach(function (el) {
        el.addEventListener("change", function () {
          var idx = Number(el.name.split("_").pop());
          if (!state.responses[pillar.id]) state.responses[pillar.id] = [];
          state.responses[pillar.id][idx] = Number(el.value);
        });
      });
    }

    function showProcessing(container) {
      var lines = [
        "Analyzing your operations...",
        "Scanning your website for context...",
        "Scoring readiness across all pillars...",
        "Generating prioritized recommendations...",
        "Packaging your report..."
      ];
      var idx = 0;

      container.innerHTML = '<div class="processing"><div><div class="spinner"></div><p id="processing-line">' + lines[0] + '</p><small>This usually takes 10-20 seconds.</small></div></div>';

      var interval = window.setInterval(function () {
        var line = document.getElementById("processing-line");
        if (!line || !state.processing) {
          window.clearInterval(interval);
          return;
        }
        idx = (idx + 1) % lines.length;
        line.textContent = lines[idx];
      }, 1600);
    }

    function serializeResponses() {
      var questionSet = getQuestionSet(state.form.industry);
      var payload = [];
      PILLARS.forEach(function (pillar) {
        var questions = getActiveQuestions(questionSet, pillar.id);
        var answers = state.responses[pillar.id] || [];
        questions.forEach(function (statement, idx) {
          payload.push({
            pillar_id: pillar.id,
            pillar_name: pillar.name,
            question_id: pillar.id + "_" + (idx + 1),
            statement: statement,
            score_0_to_3: typeof answers[idx] === "number" ? answers[idx] : null
          });
        });
      });
      return payload;
    }

    function getFunctionEndpoint(name) {
      if (CONFIG.functionBase) return CONFIG.functionBase.replace(/\/$/, "") + "/" + name;
      if (CONFIG.supabaseUrl) return CONFIG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/" + name;
      return "";
    }

    function getHeaders() {
      var headers = { "Content-Type": "application/json" };
      if (CONFIG.supabaseAnonKey) {
        headers.apikey = CONFIG.supabaseAnonKey;
        headers.Authorization = "Bearer " + CONFIG.supabaseAnonKey;
      }
      return headers;
    }

    function submitAudit() {
      var endpoint = getFunctionEndpoint("generate-audit-report");
      if (!endpoint) {
        state.processing = false;
        state.error = "Audit API is not configured. Set BP_AUDIT_CONFIG before launch.";
        render();
        return;
      }

      var payload = {
        submission_mode: state.mode,
        company_name: state.form.company_name.trim(),
        contact_name: state.form.contact_name.trim(),
        email: state.form.email.trim(),
        industry: state.form.industry,
        employee_band: state.form.employee_band,
        website_url: normalizeUrl(state.form.website_url),
        responses: serializeResponses(),
        utm: collectAttribution(),
        source_page: "audit"
      };

      window.fetch(endpoint, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || "Unable to generate audit report.");
            return data;
          });
        })
        .then(function (data) {
          var token = data.report_token;
          if (!token) throw new Error("No report token received.");
          window.location.href = "/audit/results/?token=" + encodeURIComponent(token);
        })
        .catch(function (err) {
          state.processing = false;
          state.error = err.message || "Unable to process report right now.";
          render();
        });
    }

    function nextStep() {
      if (!validateCurrentStep()) {
        render();
        return;
      }
      if (state.step < totalSteps() - 1) {
        state.step += 1;
        render();
        return;
      }
      state.processing = true;
      state.error = "";
      render();
      submitAudit();
    }

    function prevStep() {
      if (state.step > 0) {
        state.step -= 1;
        state.error = "";
        render();
      }
    }

    function render() {
      var progress = progressPct();
      root.innerHTML =
        '<section class="audit-shell">' +
        '  <aside class="audit-sidebar card">' +
        '    <h1>FREE AI Ops Readiness Audit</h1>' +
        '    <p>Actionable report in minutes. Built for established operators. Includes live website scan context.</p>' +
        '    <div class="progress-track" aria-label="Audit progress"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
        '    <div class="progress-meta"><span>Progress</span><span>' + progress + '%</span></div>' +
        '  </aside>' +
        '  <div class="audit-main card">' +
        '    <div id="audit-step-content"></div>' +
        (state.processing
          ? ""
          : '<div class="actions"><button class="btn btn-ghost" type="button" ' + (state.step === 0 ? "disabled" : "") + ' data-prev>Back</button><button class="btn btn-primary" type="button" data-next>' + (state.step === totalSteps() - 1 ? "Generate Report" : "Continue") + '</button></div>') +
        (state.error ? '<p class="error" role="alert">' + escapeHtml(state.error) + '</p>' : "") +
        '  </div>' +
        '</section>';

      var stepContent = $("#audit-step-content");
      if (state.processing) {
        showProcessing(stepContent);
        return;
      }

      if (state.step === 0) renderDetailsStep(stepContent);
      else renderPillarStep(stepContent);

      var nextBtn = root.querySelector("[data-next]");
      var prevBtn = root.querySelector("[data-prev]");
      if (nextBtn) nextBtn.addEventListener("click", nextStep);
      if (prevBtn) prevBtn.addEventListener("click", prevStep);
    }

    render();
  }

  function initResultsPage() {
    var root = $("[data-audit-results]");
    if (!root) return;

    function tokenFromUrl() {
      var pathParts = window.location.pathname.split("/").filter(Boolean);
      var idx = pathParts.indexOf("results");
      if (idx > -1 && pathParts[idx + 1]) return decodeURIComponent(pathParts[idx + 1]);
      var q = new URLSearchParams(window.location.search);
      return q.get("token") || "";
    }

    function getFunctionEndpoint(name) {
      if (CONFIG.functionBase) return CONFIG.functionBase.replace(/\/$/, "") + "/" + name;
      if (CONFIG.supabaseUrl) return CONFIG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/" + name;
      return "";
    }

    function getHeaders() {
      var headers = { "Content-Type": "application/json" };
      if (CONFIG.supabaseAnonKey) {
        headers.apikey = CONFIG.supabaseAnonKey;
        headers.Authorization = "Bearer " + CONFIG.supabaseAnonKey;
      }
      return headers;
    }

    function renderExpired(message) {
      root.innerHTML =
        '<div class="expired card">' +
        '<h2>Report Link Expired</h2>' +
        '<p class="muted">' + escapeHtml(message || "This guest report is no longer available.") + '</p>' +
        '<div class="result-actions"><a class="btn btn-primary" href="/audit">Run Another Audit</a><a class="btn btn-ghost" href="/audit">Get a Persistent Copy</a></div>' +
        '</div>';
    }

    function renderError(message) {
      root.innerHTML =
        '<div class="expired card">' +
        '<h2>Unable to Load Report</h2>' +
        '<p class="muted">' + escapeHtml(message || "Try again in a moment.") + '</p>' +
        '<div class="result-actions"><a class="btn btn-primary" href="/audit">Run Another Audit</a></div>' +
        '</div>';
    }

    function recList(items) {
      if (!items || !items.length) return '<p class="muted">No recommendations generated.</p>';
      return items.map(function (item) {
        return '<article class="rec-card">' +
          '<h4>' + escapeHtml(item.title || "Recommendation") + '</h4>' +
          '<p>' + escapeHtml(item.description || "") + '</p>' +
          '<div class="tags"><span class="tag">' + escapeHtml(item.pillar || item.pillar_id || "Pillar") + '</span><span class="tag">Impact: ' + escapeHtml(item.impact || "Medium") + '</span><span class="tag">Effort: ' + escapeHtml(item.effort || "Medium") + '</span></div>' +
          '</article>';
      }).join("");
    }

    function renderResults(payload) {
      var report = payload.report || {};
      var companyName = payload.company_name || report.company_name || "Your Company";
      var score = Number(report.overall_score || 0);
      var grade = report.letter_grade || "N/A";
      var expires = payload.expires_at || null;
      var guest = payload.submission_mode === "guest";
      var generated = payload.created_at ? new Date(payload.created_at).toLocaleString() : "";

      root.innerHTML =
        '<section class="card audit-main">' +
        (guest ? '<div class="guest-note guest-banner">Guest report expires in 24h.</div>' : "") +
        '<div class="results-header">' +
        '<div><p class="step-tag">AI Ops Readiness Report</p><h1 class="step-title">' + escapeHtml(companyName) + '</h1><span class="badge-grade">Grade ' + escapeHtml(grade) + '</span></div>' +
        '<div class="score-ring" style="--score:' + Math.max(0, Math.min(score, 100)) + '%"><span>' + score + '/100</span></div>' +
        '</div>' +
        '<div class="callouts">' +
        '<article class="callout"><h3>Top Priority</h3><p>' + escapeHtml(report.top_priority || "No top priority returned.") + '</p></article>' +
        '<article class="callout"><h3>Competitive Risk</h3><p>' + escapeHtml(report.competitive_risk || "No risk note returned.") + '</p></article>' +
        '</div>' +
        '<section class="pillars"><h2 class="step-title" style="font-size:1.35rem;margin-top:16px;">Pillar Breakdown</h2><div id="pillarRows"></div></section>' +
        '<section class="service-box"><h3>Recommended Service: ' + escapeHtml((report.recommended_service && report.recommended_service.tier) || "TBD") + '</h3><p>' + escapeHtml((report.recommended_service && report.recommended_service.why_fit) || "Service recommendation unavailable.") + '</p><p class="muted" style="margin-top:6px;">' + escapeHtml((report.recommended_service && report.recommended_service.price_range) || "") + ' ' + escapeHtml((report.recommended_service && report.recommended_service.timeline) || "") + '</p></section>' +
        '<section class="action-plan"><h2 class="step-title" style="font-size:1.35rem;">Action Plan</h2><div class="plan-columns"><div class="plan-col"><h3>Fix First</h3>' + recList(report.action_plan && report.action_plan.fix_first) + '</div><div class="plan-col"><h3>Fix Next</h3>' + recList(report.action_plan && report.action_plan.fix_next) + '</div><div class="plan-col"><h3>Leverage</h3>' + recList(report.action_plan && report.action_plan.leverage) + '</div></div></section>' +
        '<div class="result-actions screen-only"><button type="button" class="btn btn-ghost" id="downloadPdfBtn">Download Report</button><a class="btn btn-primary" href="https://calendly.com/casey-bluepixelconsulting/30min">Book a Strategy Call</a><a class="btn btn-ghost" href="/audit">Run Another Audit</a></div>' +
        '<p class="muted">Report generated: ' + escapeHtml(generated) + (guest && expires ? ' | Link expires: ' + escapeHtml(new Date(expires).toLocaleString()) : '') + '</p>' +
        (guest && expires ? '<p class="muted">Guest report generated on ' + escapeHtml(new Date(payload.created_at).toLocaleDateString()) + ', link expires in 24h.</p>' : '') +
        '</section>';

      var rows = $("#pillarRows");
      var pillarList = report.pillars || [];
      rows.innerHTML = pillarList.map(function (item, idx) {
        return '<article class="pillar-row' + (idx === 0 ? ' open' : '') + '">' +
          '<button class="pillar-head" type="button" data-toggle>' +
          '<div><p class="pillar-name">' + escapeHtml(item.name || item.pillar_id || "Pillar") + '</p><div class="pillar-meter"><span style="width:' + Number(item.score || 0) + '%"></span></div></div>' +
          '<div class="pillar-score">' + Number(item.score || 0) + '/100</div>' +
          '</button>' +
          '<div class="pillar-body">' + escapeHtml(item.assessment || "Assessment unavailable") + '</div>' +
          '</article>';
      }).join("");

      rows.querySelectorAll("[data-toggle]").forEach(function (btn) {
        btn.addEventListener("click", function () { btn.closest(".pillar-row").classList.toggle("open"); });
      });

      var dl = $("#downloadPdfBtn");
      if (dl) dl.addEventListener("click", function () { window.print(); });
    }

    var token = tokenFromUrl();
    if (!token) {
      renderError("Missing report token.");
      return;
    }

    var endpoint = getFunctionEndpoint("get-audit-report");
    if (!endpoint) {
      renderError("Results API is not configured. Set BP_AUDIT_CONFIG first.");
      return;
    }

    root.innerHTML = '<div class="processing"><div><div class="spinner"></div><p>Loading your report...</p></div></div>';

    window.fetch(endpoint + "?token=" + encodeURIComponent(token), {
      method: "GET",
      headers: getHeaders()
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (res.status === 410) { renderExpired(data.error || "This guest report has expired."); return null; }
          if (!res.ok) throw new Error(data.error || "Unable to fetch report.");
          return data;
        });
      })
      .then(function (data) { if (data) renderResults(data); })
      .catch(function (err) { renderError(err.message); });
  }

  initAuditPage();
  initResultsPage();
})();
