(function () {
  var CONFIG = window.BP_AUDIT_CONFIG || {};

  /* ── Utilities ─────────────────────────────────────────────── */
  var SCORE_LABELS = ["Not at all", "Somewhat", "Mostly", "Completely"];

  function severityColor(s) {
    if (s >= 75) return "#22c55e";
    if (s >= 56) return "#eab308";
    if (s >= 31) return "#f97316";
    return "#ef4444";
  }
  function severityClass(s) {
    if (s >= 75) return "severity-green";
    if (s >= 56) return "severity-yellow";
    if (s >= 31) return "severity-orange";
    return "severity-red";
  }
  function $(sel) { return document.querySelector(sel); }
  function normalizeUrl(v) {
    if (!v) return "";
    var t = v.trim();
    if (!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    return "https://" + t;
  }
  function isValidWebsiteUrl(v) {
    var n = normalizeUrl(v);
    if (!n) return false;
    try { var p = new URL(n); return /^https?:$/i.test(p.protocol); }
    catch (_) { return false; }
  }
  function selectedOpt(cur, val) { return cur === val ? " selected" : ""; }
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ── Pillar & question data ────────────────────────────────── */
  var PILLARS = [
    { id: "process_efficiency", name: "Process Efficiency" },
    { id: "system_integration", name: "System Integration" },
    { id: "doc_automation", name: "Document & Communication Automation" },
    { id: "data_reporting", name: "Data & Reporting Readiness" },
    { id: "ai_capacity", name: "AI Readiness & Team Capacity" }
  ];

  var BASE_QUESTIONS = {
    process_efficiency: [
      "Our quoting or estimating process is standardized and takes under 30 minutes.",
      "Customer intake and onboarding runs without manual follow-up.",
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
      "Document collection from clients or vendors does not require repeated chasing."
    ],
    data_reporting: [
      "We have clean, structured data on our customers, jobs, and financials.",
      "Our team makes decisions based on dashboards or reports, not gut feel.",
      "We could hand our data to a developer and they could build on it immediately."
    ],
    ai_capacity: [
      "Our team is open to adopting new tools and workflows.",
      "We have someone internally who could own an AI implementation.",
      "Leadership has discussed or budgeted for AI and automation."
    ]
  };

  var INDUSTRY_QUESTIONS = {
    accounting_firms: {
      process_efficiency: [
        "New client intake is standardized and does not require repeated back-and-forth.",
        "Engagement setup (letters, checklists, kickoff) can be completed quickly.",
        "Busy-season file handoffs happen without manual chasing."
      ],
      system_integration: [
        "Tax, document, and communication systems share status automatically.",
        "Client records are centralized rather than scattered across email and spreadsheets.",
        "Partners can see real-time file and deadline status in minutes."
      ],
      doc_automation: [
        "Document requests and reminders are sent automatically until completion.",
        "Engagement letters and recurring templates are generated from intake data.",
        "Client status updates can be sent without manual drafting."
      ],
      data_reporting: [
        "We can quickly identify at-risk files before key tax deadlines.",
        "Capacity and workflow reporting is visible across teams.",
        "Our operational data is structured enough to automate reporting."
      ],
      ai_capacity: BASE_QUESTIONS.ai_capacity
    },
    construction: {
      process_efficiency: [
        "Subcontractor coordination is structured and not daily phone fire drills.",
        "Change orders move quickly through a repeatable approval process.",
        "Project status updates go to clients without PM manual effort."
      ],
      system_integration: [
        "Bids, schedules, and job financials stay in sync across tools.",
        "Field updates and office workflows share the same source of truth.",
        "We can pull project risk and schedule reports in under 5 minutes."
      ],
      doc_automation: [
        "Change orders, RFIs, and site docs can be drafted automatically.",
        "Subcontractor reminders and confirmations are automated.",
        "Safety incident data can be captured without manual re-entry."
      ],
      data_reporting: [
        "Project milestones and delays are tracked in structured data.",
        "Leadership decisions are based on live reporting, not only meetings.",
        "Our project data quality supports automated coordination workflows."
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
        "Referral tracking does not depend on manual inbox management.",
        "Recurring forms and patient communications generate from system data."
      ],
      data_reporting: [
        "No-show, recall, and intake performance data is clean and reportable.",
        "Operational decisions rely on reporting, not only staff memory.",
        "Our data is structured enough for compliant automation."
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
        "Owner reports generate from property data with minimal manual assembly.",
        "Tenant acknowledgments and status updates run automatically.",
        "AGM and compliance documents can be templated and automated."
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
        "Quotes and invoices generate from job intake data.",
        "Customer confirmations, reminders, and review requests run automatically.",
        "Cold quote follow-up runs in sequence without manual chasing."
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
        "Engagement letters and recurring drafts generate from intake data.",
        "Client updates and reminders are automated for routine milestones.",
        "Document-heavy workflows are pre-structured for automation."
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
        "We can pull key operations and compliance metrics quickly."
      ],
      doc_automation: [
        "Compliance and stewardship reporting generates from field inputs.",
        "Crew dispatch updates and confirmations are automated.",
        "Timber cruise and volume reporting does not require manual compilation."
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

  var INDUSTRY_LABELS = {};
  INDUSTRY_OPTIONS.forEach(function (o) { INDUSTRY_LABELS[o.value] = o.label; });

  /* ── Question page definitions (3 pages x 3 questions) ───── */
  var QUESTION_PAGES = [
    {
      title: "How your operations run",
      subtitle: "Think about a typical week at your business.",
      questions: [
        { pillar_id: "process_efficiency", q_index: 0 },
        { pillar_id: "doc_automation", q_index: 1 },
        { pillar_id: "system_integration", q_index: 1 }
      ]
    },
    {
      title: "Your systems & data",
      subtitle: "How connected and reliable is your information?",
      questions: [
        { pillar_id: "system_integration", q_index: 2 },
        { pillar_id: "data_reporting", q_index: 0 },
        { pillar_id: "data_reporting", q_index: 1 }
      ]
    },
    {
      title: "Ready for AI?",
      subtitle: "How prepared is your team for what comes next?",
      questions: [
        { pillar_id: "ai_capacity", q_index: 0 },
        { pillar_id: "ai_capacity", q_index: 1 },
        { pillar_id: "ai_capacity", q_index: 2 }
      ]
    }
  ];

  function getQuestionText(industry, pillar_id, q_index) {
    var specific = INDUSTRY_QUESTIONS[industry];
    if (specific && specific[pillar_id]) return specific[pillar_id][q_index] || BASE_QUESTIONS[pillar_id][q_index];
    return BASE_QUESTIONS[pillar_id][q_index];
  }

  function pillarName(id) {
    for (var i = 0; i < PILLARS.length; i++) { if (PILLARS[i].id === id) return PILLARS[i].name; }
    return id;
  }

  /* ── Processing messages per industry ──────────────────────── */
  var PROCESSING_LINES = {
    _default: [
      "Scanning your website for automation signals...",
      "Mapping workflows, CTAs, and system touchpoints...",
      "Comparing against industry benchmarks...",
      "Identifying your highest-leverage quick wins...",
      "Building your personalized action plan..."
    ],
    accounting_firms: [
      "Scanning your website for client intake signals...",
      "Analyzing engagement and document workflows...",
      "Benchmarking against top-performing firms...",
      "Pinpointing busy-season bottlenecks...",
      "Building your personalized action plan..."
    ],
    trades: [
      "Scanning your website for quoting and booking flows...",
      "Analyzing dispatch and follow-up workflows...",
      "Benchmarking against high-growth trade companies...",
      "Identifying revenue leaks in your pipeline...",
      "Building your personalized action plan..."
    ],
    construction: [
      "Scanning your website for project intake signals...",
      "Analyzing coordination and change-order workflows...",
      "Benchmarking against leading builders...",
      "Identifying scheduling and handoff bottlenecks...",
      "Building your personalized action plan..."
    ],
    medical_clinics: [
      "Scanning your website for patient intake flows...",
      "Analyzing scheduling and communication workflows...",
      "Benchmarking against high-efficiency clinics...",
      "Identifying patient experience quick wins...",
      "Building your personalized action plan..."
    ],
    property_management: [
      "Scanning your website for tenant and owner workflows...",
      "Analyzing maintenance and lease renewal processes...",
      "Benchmarking against top property managers...",
      "Identifying portfolio-wide automation gaps...",
      "Building your personalized action plan..."
    ],
    law_firms: [
      "Scanning your website for client intake signals...",
      "Analyzing matter management and billing workflows...",
      "Benchmarking against efficient practices...",
      "Identifying document and deadline automation wins...",
      "Building your personalized action plan..."
    ],
    forestry_logging: [
      "Scanning your website for operations signals...",
      "Analyzing field-to-office data workflows...",
      "Benchmarking against modern forestry operations...",
      "Identifying compliance and reporting quick wins...",
      "Building your personalized action plan..."
    ]
  };

  /* ── Audit form ────────────────────────────────────────────── */
  function initAuditPage() {
    var root = $("[data-audit-app]");
    if (!root) return;

    var TOTAL_STEPS = QUESTION_PAGES.length + 1; // intro + 3 question pages

    var state = {
      step: 0,         // 0 = intro, 1-3 = question pages
      mode: "standard",
      processing: false,
      transitioning: false,
      error: "",
      form: {
        company_name: "",
        contact_name: "",
        email: "",
        industry: "",
        employee_band: "",
        website_url: ""
      },
      answers: {} // key: "pillar_id:q_index", value: 0-3
    };

    function answerKey(pillar_id, q_index) { return pillar_id + ":" + q_index; }

    function collectAttribution() {
      var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "wbraid", "gbraid", "msclkid", "fbclid"];
      var out = {};
      var params = new URLSearchParams(window.location.search);
      keys.forEach(function (k) { var v = params.get(k); if (v) out[k] = v; });
      return out;
    }

    function validateIntro() {
      state.error = "";
      if (state.mode === "standard" && !state.form.email.trim()) {
        state.error = "Email is required for a persistent report link.";
        return false;
      }
      if (state.mode === "standard" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.form.email.trim())) {
        state.error = "Enter a valid email address.";
        return false;
      }
      if (!state.form.industry) { state.error = "Select your industry."; return false; }
      if (!state.form.employee_band) { state.error = "Select your company size."; return false; }
      if (!isValidWebsiteUrl(state.form.website_url)) {
        state.error = "Enter your website so our AI agent can scan it.";
        return false;
      }
      return true;
    }

    function validateQuestionPage() {
      state.error = "";
      var page = QUESTION_PAGES[state.step - 1];
      for (var i = 0; i < page.questions.length; i++) {
        var q = page.questions[i];
        if (typeof state.answers[answerKey(q.pillar_id, q.q_index)] !== "number") {
          state.error = "Answer all three before continuing.";
          return false;
        }
      }
      return true;
    }

    function serializeResponses() {
      var byPillar = {};
      QUESTION_PAGES.forEach(function (page) {
        page.questions.forEach(function (q) {
          if (!byPillar[q.pillar_id]) byPillar[q.pillar_id] = [];
          byPillar[q.pillar_id].push({
            pillar_id: q.pillar_id,
            pillar_name: pillarName(q.pillar_id),
            question_id: q.pillar_id + "_" + (byPillar[q.pillar_id].length + 1),
            statement: getQuestionText(state.form.industry, q.pillar_id, q.q_index),
            score_0_to_3: state.answers[answerKey(q.pillar_id, q.q_index)] != null ? state.answers[answerKey(q.pillar_id, q.q_index)] : null
          });
        });
      });
      var payload = [];
      PILLARS.forEach(function (p) { if (byPillar[p.id]) payload = payload.concat(byPillar[p.id]); });
      return payload;
    }

    function getFunctionEndpoint(name) {
      if (CONFIG.functionBase) return CONFIG.functionBase.replace(/\/$/, "") + "/" + name;
      if (CONFIG.supabaseUrl) return CONFIG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/" + name;
      return "";
    }
    function getHeaders() {
      var h = { "Content-Type": "application/json" };
      if (CONFIG.supabaseAnonKey) { h.apikey = CONFIG.supabaseAnonKey; h.Authorization = "Bearer " + CONFIG.supabaseAnonKey; }
      return h;
    }

    function submitAudit() {
      var endpoint = getFunctionEndpoint("generate-audit-report");
      if (!endpoint) {
        state.processing = false;
        state.error = "Audit API is not configured.";
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
      window.fetch(endpoint, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) })
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

    /* ── Render: intro step ──────────────────────────────────── */
    function renderIntro(container) {
      var opts = INDUSTRY_OPTIONS.map(function (o) {
        return '<option value="' + o.value + '"' + selectedOpt(state.form.industry, o.value) + '>' + o.label + '</option>';
      }).join("");

      container.innerHTML =
        '<div class="flow-intro">' +
        '<h1 class="flow-headline">Free AI Ops Audit</h1>' +
        '<p class="flow-sub">9 quick questions. Our AI agent scans your website.<br>You get a personalized action plan in under a minute.</p>' +
        '<div class="intro-fields">' +
        '  <div class="intro-row">' +
        '    <div class="field"><label for="company_name">Company name</label><input id="company_name" name="company_name" value="' + escapeHtml(state.form.company_name) + '" placeholder="Acme Corp"></div>' +
        '    <div class="field"><label for="email">Email' + (state.mode === "standard" ? "" : " (optional)") + '</label><input id="email" type="email" name="email" value="' + escapeHtml(state.form.email) + '" placeholder="you@company.com"></div>' +
        '  </div>' +
        '  <div class="intro-row">' +
        '    <div class="field"><label for="industry">Industry*</label><select id="industry" name="industry"><option value="">Select industry</option>' + opts + '</select></div>' +
        '    <div class="field"><label for="employee_band">Company size*</label><select id="employee_band" name="employee_band"><option value="">Select range</option><option value="10-25"' + selectedOpt(state.form.employee_band, "10-25") + '>10 – 25 people</option><option value="25-50"' + selectedOpt(state.form.employee_band, "25-50") + '>25 – 50</option><option value="50-100"' + selectedOpt(state.form.employee_band, "50-100") + '>50 – 100</option><option value="100-250"' + selectedOpt(state.form.employee_band, "100-250") + '>100 – 250</option><option value="250+"' + selectedOpt(state.form.employee_band, "250+") + '>250+</option></select></div>' +
        '  </div>' +
        '  <div class="field full"><label for="website_url">Company website*</label><input id="website_url" name="website_url" value="' + escapeHtml(state.form.website_url) + '" placeholder="yourcompany.com"><div class="helper">Our AI agent scans your site to find gaps and opportunities.</div></div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-lg" data-next>Start Audit</button>' +
        '<button type="button" class="guest-toggle" data-guest-toggle>' + (state.mode === "standard" ? "Skip email (guest mode)" : "Switch to standard mode") + '</button>' +
        '</div>';

      container.querySelectorAll("input, select").forEach(function (el) {
        el.addEventListener("input", function () { state.form[el.name] = el.value; });
      });
      var toggle = container.querySelector("[data-guest-toggle]");
      if (toggle) toggle.addEventListener("click", function () {
        state.mode = state.mode === "standard" ? "guest" : "standard";
        if (state.mode === "guest") state.form.email = "";
        render();
      });
    }

    /* ── Render: question page ───────────────────────────────── */
    function renderQuestionPage(container) {
      var pageIdx = state.step - 1;
      var page = QUESTION_PAGES[pageIdx];

      var qhtml = page.questions.map(function (q, i) {
        var text = getQuestionText(state.form.industry, q.pillar_id, q.q_index);
        var key = answerKey(q.pillar_id, q.q_index);
        var current = state.answers[key];

        var options = SCORE_LABELS.map(function (label, score) {
          var sel = current === score ? " selected" : "";
          return '<button type="button" class="answer-pill' + sel + '" data-key="' + key + '" data-score="' + score + '">' + label + '</button>';
        }).join("");

        return '<div class="q-block"><p class="q-number">Q' + (pageIdx * 3 + i + 1) + ' of 9</p><p class="q-text">' + escapeHtml(text) + '</p><div class="answer-row">' + options + '</div></div>';
      }).join("");

      container.innerHTML =
        '<div class="flow-questions">' +
        '<div class="step-dots">' +
        '<span class="dot done"></span>' +
        '<span class="dot' + (pageIdx >= 0 ? " active" : "") + (pageIdx > 0 ? " done" : "") + '"></span>' +
        '<span class="dot' + (pageIdx >= 1 ? " active" : "") + (pageIdx > 1 ? " done" : "") + '"></span>' +
        '<span class="dot' + (pageIdx >= 2 ? " active" : "") + '"></span>' +
        '</div>' +
        '<h2 class="flow-page-title">' + escapeHtml(page.title) + '</h2>' +
        '<p class="flow-sub">' + escapeHtml(page.subtitle) + '</p>' +
        qhtml +
        '<div class="flow-nav"><button type="button" class="btn btn-ghost" data-prev>Back</button><button type="button" class="btn btn-primary" data-next>' + (state.step === TOTAL_STEPS - 1 ? "Generate My Report" : "Continue") + '</button></div>' +
        '</div>';

      container.querySelectorAll(".answer-pill").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-key");
          var score = Number(btn.getAttribute("data-score"));
          state.answers[key] = score;
          /* Update siblings */
          btn.parentNode.querySelectorAll(".answer-pill").forEach(function (b) { b.classList.remove("selected"); });
          btn.classList.add("selected");
        });
      });
    }

    /* ── Render: transitioning (industry personalization) ───── */
    function renderTransition(container) {
      var label = INDUSTRY_LABELS[state.form.industry] || "your industry";
      container.innerHTML =
        '<div class="flow-transition">' +
        '<div class="pulse-ring"></div>' +
        '<p>Tailoring your audit for <strong>' + escapeHtml(label) + '</strong>...</p>' +
        '</div>';
    }

    /* ── Render: processing ──────────────────────────────────── */
    function renderProcessing(container) {
      var lines = PROCESSING_LINES[state.form.industry] || PROCESSING_LINES._default;
      var idx = 0;
      container.innerHTML =
        '<div class="flow-processing">' +
        '<div class="scan-visual"><div class="scan-ring"></div><div class="scan-ring ring-2"></div><div class="scan-dot"></div></div>' +
        '<p class="proc-line" id="proc-line">' + lines[0] + '</p>' +
        '<p class="proc-meta">This usually takes 15 – 35 seconds</p>' +
        '</div>';
      var interval = window.setInterval(function () {
        var el = document.getElementById("proc-line");
        if (!el || !state.processing) { window.clearInterval(interval); return; }
        idx = (idx + 1) % lines.length;
        el.style.opacity = "0";
        setTimeout(function () { el.textContent = lines[idx]; el.style.opacity = "1"; }, 250);
      }, 2400);
    }

    /* ── Navigation ──────────────────────────────────────────── */
    function nextStep() {
      if (state.step === 0) {
        if (!validateIntro()) { render(); return; }
        /* Show brief transition */
        state.transitioning = true;
        render();
        setTimeout(function () {
          state.transitioning = false;
          state.step = 1;
          render();
        }, 1400);
        return;
      }
      if (!validateQuestionPage()) { render(); return; }
      if (state.step < TOTAL_STEPS - 1) {
        state.step += 1;
        state.error = "";
        render();
        return;
      }
      /* Final step → submit */
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

    /* ── Main render ─────────────────────────────────────────── */
    function render() {
      root.innerHTML =
        '<div class="audit-flow">' +
        '<div id="audit-content" class="flow-content"></div>' +
        (state.error && !state.processing && !state.transitioning ? '<p class="flow-error" role="alert">' + escapeHtml(state.error) + '</p>' : "") +
        '</div>';

      var content = $("#audit-content");
      if (state.processing) { renderProcessing(content); return; }
      if (state.transitioning) { renderTransition(content); return; }
      if (state.step === 0) { renderIntro(content); }
      else { renderQuestionPage(content); }

      var nextBtn = root.querySelector("[data-next]");
      var prevBtn = root.querySelector("[data-prev]");
      if (nextBtn) nextBtn.addEventListener("click", nextStep);
      if (prevBtn) prevBtn.addEventListener("click", prevStep);
    }

    render();
  }

  /* ══════════════════════════════════════════════════════════════
     Results page
     ══════════════════════════════════════════════════════════════ */
  function initResultsPage() {
    var root = $("[data-audit-results]");
    if (!root) return;

    function tokenFromUrl() {
      var parts = window.location.pathname.split("/").filter(Boolean);
      var idx = parts.indexOf("results");
      if (idx > -1 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
      return new URLSearchParams(window.location.search).get("token") || "";
    }
    function getFunctionEndpoint(name) {
      if (CONFIG.functionBase) return CONFIG.functionBase.replace(/\/$/, "") + "/" + name;
      if (CONFIG.supabaseUrl) return CONFIG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/" + name;
      return "";
    }
    function getHeaders() {
      var h = { "Content-Type": "application/json" };
      if (CONFIG.supabaseAnonKey) { h.apikey = CONFIG.supabaseAnonKey; h.Authorization = "Bearer " + CONFIG.supabaseAnonKey; }
      return h;
    }

    function renderExpired(msg) {
      root.innerHTML = '<div class="expired card"><h2>Report Link Expired</h2><p class="muted">' + escapeHtml(msg || "This guest report is no longer available.") + '</p><div class="result-actions"><a class="btn btn-primary" href="/audit">Run Another Audit</a></div></div>';
    }
    function renderError(msg) {
      root.innerHTML = '<div class="expired card"><h2>Unable to Load Report</h2><p class="muted">' + escapeHtml(msg || "Try again in a moment.") + '</p><div class="result-actions"><a class="btn btn-primary" href="/audit">Run Another Audit</a></div></div>';
    }

    /* ── Price-cap: keep everything under $10k ───────────────── */
    function adjustService(service, score) {
      var base = {
        tier: (service && service.tier) || "Starter Engagement",
        why_fit: (service && service.why_fit) || "A focused engagement targeting your top bottleneck."
      };
      if (score < 31)       { base.price_range = "$4,500 \u2013 $8,500"; base.timeline = "4\u20136 weeks"; }
      else if (score < 56)  { base.price_range = "$3,500 \u2013 $7,500"; base.timeline = "3\u20135 weeks"; }
      else if (score < 75)  { base.price_range = "$2,500 \u2013 $5,000"; base.timeline = "2\u20134 weeks"; }
      else                  { base.price_range = "$2,500 \u2013 $6,000"; base.timeline = "2\u20134 weeks"; }
      return base;
    }

    function recList(items) {
      if (!items || !items.length) return '<p class="muted">No recommendations generated.</p>';
      return items.map(function (item) {
        return '<article class="rec-card"><h4>' + escapeHtml(item.title || "Recommendation") + '</h4><p>' + escapeHtml(item.description || "") + '</p><div class="tags"><span class="tag">' + escapeHtml(item.pillar || item.pillar_id || "Pillar") + '</span><span class="tag">Impact: ' + escapeHtml(item.impact || "Medium") + '</span><span class="tag">Effort: ' + escapeHtml(item.effort || "Medium") + '</span></div></article>';
      }).join("");
    }

    function renderScanList(title, items) {
      if (!items || !items.length) return "";
      return '<div class="scan-col"><h4>' + escapeHtml(title) + '</h4><ul class="scan-list">' + items.slice(0, 5).map(function (i) { return '<li>' + escapeHtml(i) + '</li>'; }).join("") + '</ul></div>';
    }

    function siteScanHtml(report, payload) {
      var summary = report.site_scan_summary || null;
      var raw = payload.website_scan || null;
      if (!summary && !raw) return '<section class="site-scan"><h2 class="step-title" style="font-size:1.35rem;margin-top:16px;">AI Site Agent Scan</h2><p class="muted">No website scan data available.</p></section>';

      var overview = (summary && summary.overview) || (raw ? ('Scanned ' + Number(raw.pages_scanned || 0) + ' pages from ' + escapeHtml(raw.root_url || "your site") + '.') : "Website scan completed.");
      var pagesReviewed = [];
      if (summary && Array.isArray(summary.pages_reviewed)) {
        pagesReviewed = summary.pages_reviewed.map(function (p) { return (p && p.url ? p.url : "") + (p && p.why_it_matters ? " \u2014 " + p.why_it_matters : ""); });
      } else if (raw && Array.isArray(raw.pages)) {
        pagesReviewed = raw.pages.map(function (p) { return (p && p.url ? p.url : "") + (p && p.title ? " \u2014 " + p.title : ""); });
      }
      var strengths = (summary && summary.strengths) || [];
      var gaps = (summary && summary.gaps) || [];
      var quickWins = (summary && summary.quick_wins) || (raw && raw.opportunities) || [];
      var tags = [];
      if (raw && raw.detected_signals) {
        var s = raw.detected_signals;
        tags.push('Pages scanned: ' + Number(raw.pages_scanned || 0));
        tags.push('Pricing visible: ' + (s.pricing_visible ? 'Yes' : 'No'));
        tags.push('Booking path: ' + (s.booking_path_present ? 'Yes' : 'No'));
        tags.push('Form detected: ' + (s.contact_form_present ? 'Yes' : 'No'));
      }
      return '<section class="site-scan"><h2 class="step-title" style="font-size:1.35rem;margin-top:16px;">AI Site Agent Scan</h2><p class="muted">' + escapeHtml(overview) + '</p>' +
        (tags.length ? '<div class="scan-tags">' + tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="scan-grid">' + renderScanList('Pages Reviewed', pagesReviewed) + renderScanList('Detected Strengths', strengths) + renderScanList('Detected Gaps', gaps) + renderScanList('Quick Wins', quickWins) + '</div></section>';
    }

    /* ── Animated score counter ───────────────────────────────── */
    function animateScore(el, target) {
      var current = 0;
      var step = Math.max(1, Math.round(target / 40));
      var timer = setInterval(function () {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current + "/100";
      }, 30);
    }

    function renderResults(payload) {
      var report = payload.report || {};
      var companyName = payload.company_name || report.company_name || "Your Company";
      var score = Number(report.overall_score || 0);
      var grade = report.letter_grade || "N/A";
      var gradeDesc = report.grade_label || grade;
      var guest = payload.submission_mode === "guest";
      var expires = payload.expires_at || null;
      var generated = payload.created_at ? new Date(payload.created_at).toLocaleString() : "";

      var svc = adjustService(report.recommended_service, score);

      root.innerHTML =
        '<section class="card audit-main">' +
        (guest ? '<div class="guest-note guest-banner">Guest report \u2014 expires in 24h.</div>' : "") +
        '<div class="results-header">' +
        '<div><p class="step-tag">AI Ops Readiness Report</p><h1 class="step-title">' + escapeHtml(companyName) + '</h1><span class="badge-grade ' + severityClass(score) + '">' + escapeHtml(grade) + ' \u2014 ' + escapeHtml(gradeDesc) + '</span></div>' +
        '<div class="score-ring" style="--score:' + Math.max(0, Math.min(score, 100)) + '%;--score-color:' + severityColor(score) + '"><span id="score-counter">0/100</span></div>' +
        '</div>' +
        (report.executive_summary ? '<p class="executive-summary">' + escapeHtml(report.executive_summary) + '</p>' : '') +
        '<div class="callouts">' +
        '<article class="callout"><h3>Top Priority</h3><p>' + escapeHtml(report.top_priority || "No top priority returned.") + '</p></article>' +
        '<article class="callout"><h3>Competitive Risk</h3><p>' + escapeHtml(report.competitive_risk || "No risk note returned.") + '</p></article>' +
        '</div>' +
        siteScanHtml(report, payload) +
        '<section class="pillars"><h2 class="step-title" style="font-size:1.35rem;margin-top:16px;">Pillar Breakdown</h2><div id="pillarRows"></div></section>' +
        '<section class="service-box"><h3>Recommended: ' + escapeHtml(svc.tier) + '</h3><p>' + escapeHtml(svc.why_fit) + '</p><p class="muted" style="margin-top:6px;">' + escapeHtml(svc.price_range) + ' &bull; ' + escapeHtml(svc.timeline) + '</p></section>' +
        '<section class="action-plan"><h2 class="step-title" style="font-size:1.35rem;">Action Plan</h2><div class="plan-columns"><div class="plan-col"><h3>Fix First</h3>' + recList(report.action_plan && report.action_plan.fix_first) + '</div><div class="plan-col"><h3>Fix Next</h3>' + recList(report.action_plan && report.action_plan.fix_next) + '</div><div class="plan-col"><h3>Leverage</h3>' + recList(report.action_plan && report.action_plan.leverage) + '</div></div></section>' +
        '<div class="result-actions screen-only"><button type="button" class="btn btn-ghost" id="downloadPdfBtn">Download Report</button><a class="btn btn-primary" href="https://calendly.com/casey-bluepixelconsulting/30min">Book a Strategy Call</a><a class="btn btn-ghost" href="/audit">Run Another Audit</a></div>' +
        '<p class="muted">Report generated: ' + escapeHtml(generated) + (guest && expires ? ' | Expires: ' + escapeHtml(new Date(expires).toLocaleString()) : '') + '</p>' +
        '</section>';

      /* Animate score */
      var counter = document.getElementById("score-counter");
      if (counter && score > 0) setTimeout(function () { animateScore(counter, score); }, 400);

      /* Pillar rows */
      var rows = $("#pillarRows");
      var pillarList = report.pillars || [];
      rows.innerHTML = pillarList.map(function (item, idx) {
        var ps = Number(item.score || 0);
        var open = ps < 56 || idx === 0;
        return '<article class="pillar-row ' + severityClass(ps) + (open ? ' open' : '') + '"><button class="pillar-head" type="button" data-toggle><div><p class="pillar-name">' + escapeHtml(item.name || item.pillar_id || "Pillar") + '</p><div class="pillar-meter"><span style="width:' + ps + '%;background:' + severityColor(ps) + '"></span></div></div><div class="pillar-score" style="color:' + severityColor(ps) + '">' + ps + '/100</div></button><div class="pillar-body">' + escapeHtml(item.assessment || "Assessment unavailable") + '</div></article>';
      }).join("");

      rows.querySelectorAll("[data-toggle]").forEach(function (btn) {
        btn.addEventListener("click", function () { btn.closest(".pillar-row").classList.toggle("open"); });
      });

      var dl = $("#downloadPdfBtn");
      if (dl) dl.addEventListener("click", function () { window.print(); });
    }

    /* ── Load report ─────────────────────────────────────────── */
    var token = tokenFromUrl();
    if (!token) { renderError("Missing report token."); return; }
    var endpoint = getFunctionEndpoint("get-audit-report");
    if (!endpoint) { renderError("Results API is not configured."); return; }

    root.innerHTML = '<div class="processing"><div><div class="spinner"></div><p>Loading your report...</p></div></div>';

    window.fetch(endpoint + "?token=" + encodeURIComponent(token), { method: "GET", headers: getHeaders() })
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
