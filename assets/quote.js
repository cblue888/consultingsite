(function () {
  'use strict';

  /* ───────── Helpers ───────── */
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function fmt(n) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
  function fmtFull(n) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(n); }
  function pct(n) { return (n * 100).toFixed(0) + '%'; }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function today() { var d = new Date(); return d.toISOString().slice(0, 10); }
  function genId() { return 'N5-2026-' + String(Math.floor(1000 + Math.random() * 9000)); }

  /* ───────── Project Templates ───────── */
  var TEMPLATES = {
    'Commercial TI': {
      contingency: 0.10,
      items: [
        { name: 'Demolition & Abatement', unit: 'sqft', rate: 4.50 },
        { name: 'Framing & Drywall', unit: 'sqft', rate: 12.00 },
        { name: 'Electrical Rough-in & Finish', unit: 'sqft', rate: 9.50 },
        { name: 'Mechanical (HVAC)', unit: 'sqft', rate: 11.00 },
        { name: 'Plumbing', unit: 'sqft', rate: 6.00 },
        { name: 'Fire Protection', unit: 'sqft', rate: 3.50 },
        { name: 'Flooring (LVP / Carpet Tile)', unit: 'sqft', rate: 7.00 },
        { name: 'Painting & Wall Finishes', unit: 'sqft', rate: 3.00 },
        { name: 'Millwork & Casework', unit: 'lump', rate: 15000 },
        { name: 'Doors, Frames & Hardware', unit: 'lump', rate: 8500 },
        { name: 'Project Management', unit: 'pct', rate: 0.08 },
        { name: 'General Conditions', unit: 'pct', rate: 0.06 }
      ]
    },
    'Multi-Family': {
      contingency: 0.08,
      items: [
        { name: 'Site Prep & Excavation', unit: 'sqft', rate: 6.00 },
        { name: 'Foundation & Concrete', unit: 'sqft', rate: 18.00 },
        { name: 'Structural Framing (Wood / Steel)', unit: 'sqft', rate: 22.00 },
        { name: 'Building Envelope & Waterproofing', unit: 'sqft', rate: 8.00 },
        { name: 'Mechanical Systems', unit: 'sqft', rate: 14.00 },
        { name: 'Electrical Distribution', unit: 'sqft', rate: 10.00 },
        { name: 'Plumbing & Fixtures', unit: 'sqft', rate: 9.00 },
        { name: 'Interior Finishes (per unit avg)', unit: 'sqft', rate: 15.00 },
        { name: 'Common Area Finishes', unit: 'lump', rate: 45000 },
        { name: 'Elevator Installation', unit: 'lump', rate: 85000 },
        { name: 'Project Management', unit: 'pct', rate: 0.07 },
        { name: 'General Conditions', unit: 'pct', rate: 0.05 }
      ]
    },
    'New Build': {
      contingency: 0.08,
      items: [
        { name: 'Site Work & Grading', unit: 'sqft', rate: 5.00 },
        { name: 'Foundation & Concrete', unit: 'sqft', rate: 16.00 },
        { name: 'Structural Steel / Framing', unit: 'sqft', rate: 20.00 },
        { name: 'Roofing & Waterproofing', unit: 'sqft', rate: 6.50 },
        { name: 'Exterior Cladding & Glazing', unit: 'sqft', rate: 12.00 },
        { name: 'Mechanical (HVAC & Controls)', unit: 'sqft', rate: 13.00 },
        { name: 'Electrical & Low Voltage', unit: 'sqft', rate: 10.50 },
        { name: 'Plumbing & Fire Suppression', unit: 'sqft', rate: 7.50 },
        { name: 'Interior Finishes', unit: 'sqft', rate: 14.00 },
        { name: 'Landscaping & Hardscape', unit: 'lump', rate: 35000 },
        { name: 'Project Management', unit: 'pct', rate: 0.07 },
        { name: 'General Conditions', unit: 'pct', rate: 0.06 }
      ]
    },
    'Renovation': {
      contingency: 0.10,
      items: [
        { name: 'Selective Demolition', unit: 'sqft', rate: 5.00 },
        { name: 'Structural Modifications', unit: 'sqft', rate: 8.00 },
        { name: 'Framing & Drywall Repairs', unit: 'sqft', rate: 10.00 },
        { name: 'Electrical Upgrades', unit: 'sqft', rate: 8.50 },
        { name: 'Mechanical Updates', unit: 'sqft', rate: 9.00 },
        { name: 'Plumbing Rework', unit: 'sqft', rate: 5.50 },
        { name: 'Flooring & Finishes', unit: 'sqft', rate: 8.00 },
        { name: 'Painting & Touch-ups', unit: 'sqft', rate: 2.50 },
        { name: 'Millwork & Custom Fixtures', unit: 'lump', rate: 12000 },
        { name: 'Project Management', unit: 'pct', rate: 0.08 },
        { name: 'General Conditions', unit: 'pct', rate: 0.06 }
      ]
    },
    'Maintenance': {
      contingency: 0.05,
      items: [
        { name: 'Building Envelope Inspection & Repair', unit: 'sqft', rate: 2.00 },
        { name: 'HVAC Servicing & Upgrades', unit: 'sqft', rate: 3.50 },
        { name: 'Plumbing Maintenance', unit: 'sqft', rate: 2.00 },
        { name: 'Electrical Panel & Wiring Check', unit: 'sqft', rate: 1.50 },
        { name: 'Fire Safety Systems Inspection', unit: 'sqft', rate: 1.25 },
        { name: 'Flooring Repair & Replacement', unit: 'sqft', rate: 3.00 },
        { name: 'Painting & Sealants', unit: 'sqft', rate: 1.75 },
        { name: 'General Labour & Clean-up', unit: 'lump', rate: 5000 },
        { name: 'Project Management', unit: 'pct', rate: 0.06 },
        { name: 'General Conditions', unit: 'pct', rate: 0.04 }
      ]
    }
  };

  var TIMELINE_SURCHARGE = { 'Urgent': 0.15, '1-3 months': 0.05, '3-6 months': 0, 'Flexible': 0 };

  /* ───────── Dummy Dashboard Data ───────── */
  var DUMMY_QUOTES = [
    { id: 'N5-2026-0142', client: 'Westbank Corp', company: 'Westbank Corp', project: 'Commercial TI', value: 287500, status: 'Accepted', date: '2026-03-15' },
    { id: 'N5-2026-0139', client: 'Amit Patel', company: 'Bosa Properties', project: 'Multi-Family', value: 1450000, status: 'Sent', date: '2026-03-12' },
    { id: 'N5-2026-0135', client: 'Jennifer Wu', company: 'Lululemon HQ', project: 'Commercial TI', value: 425000, status: 'Viewed', date: '2026-03-08' },
    { id: 'N5-2026-0131', client: 'David Chen', company: 'Telus Realty', project: 'New Build', value: 2100000, status: 'Accepted', date: '2026-03-01' },
    { id: 'N5-2026-0128', client: 'Sarah Macleod', company: 'Cactus Club Restaurants', project: 'Renovation', value: 185000, status: 'Declined', date: '2026-02-24' },
    { id: 'N5-2026-0124', client: 'Ryan Kowalski', company: "Arc'teryx Retail", project: 'Commercial TI', value: 310000, status: 'Expired', date: '2026-02-18' },
    { id: 'N5-2026-0121', client: 'Dr. Priya Sharma', company: 'Pacific Dental Group', project: 'Renovation', value: 92000, status: 'Accepted', date: '2026-02-15' },
    { id: 'N5-2026-0118', client: 'Mike Torres', company: 'Hootsuite', project: 'Commercial TI', value: 540000, status: 'Viewed', date: '2026-02-10' },
    { id: 'N5-2026-0115', client: 'Laura Singh', company: 'Canucks Sports & Ent.', project: 'Maintenance', value: 45000, status: 'Accepted', date: '2026-02-05' },
    { id: 'N5-2026-0112', client: 'Jason Lee', company: 'Aritzia Corporate', project: 'New Build', value: 1800000, status: 'Sent', date: '2026-01-28' }
  ];

  /* ───────── State ───────── */
  var state = {
    view: 'builder',
    form: {},
    estimate: null,
    quotes: DUMMY_QUOTES.slice()
  };

  var root;

  /* ───────── Render Router ───────── */
  function render() {
    if (!root) root = document.querySelector('[data-quote-app]');
    updateNav();
    switch (state.view) {
      case 'builder':   renderBuilder(); break;
      case 'estimate':  renderEstimate(); break;
      case 'dashboard': renderDashboard(); break;
    }
  }

  function updateNav() {
    document.querySelectorAll('.nav-link').forEach(function (el) {
      el.classList.toggle('active', el.dataset.view === state.view || (el.dataset.view === 'builder' && state.view === 'estimate'));
    });
  }

  function nav(view) { state.view = view; render(); window.scrollTo(0, 0); }

  /* ───────── View 1: Quote Builder ───────── */
  function renderBuilder() {
    var f = state.form;
    root.innerHTML =
      '<div class="card">' +
        '<div class="card-header">' +
          '<h2>New Project Estimate</h2>' +
          '<p>Enter project details to generate a professional estimate.</p>' +
        '</div>' +
        '<div class="form-grid">' +
          field('Client Name', 'clientName', 'text', f.clientName, 'John Smith', true) +
          field('Company', 'company', 'text', f.company, 'Acme Properties Inc.') +
          field('Email', 'email', 'email', f.email, 'john@acme.com', true) +
          field('Phone', 'phone', 'tel', f.phone, '(604) 555-0123') +
          fieldSelect('Project Type', 'projectType', ['Commercial TI', 'Multi-Family', 'New Build', 'Renovation', 'Maintenance'], f.projectType, true) +
          field('Approximate Square Footage', 'sqft', 'number', f.sqft, '5,000', true) +
          fieldSelect('Timeline', 'timeline', ['Urgent', '1-3 months', '3-6 months', 'Flexible'], f.timeline, true) +
          fieldTextarea('Scope Description', 'scope', f.scope, 'Describe the project scope, special requirements, finishes, etc.') +
        '</div>' +
        '<div class="btn-group">' +
          '<button class="btn btn-primary btn-lg" id="generate-btn">Generate Estimate</button>' +
        '</div>' +
      '</div>';

    document.getElementById('generate-btn').addEventListener('click', handleGenerate);
    // Persist form state on input
    root.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { state.form[el.name] = el.value; });
      el.addEventListener('change', function () { state.form[el.name] = el.value; });
    });
  }

  function field(label, name, type, value, placeholder, required) {
    return '<div class="field">' +
      '<label for="f-' + name + '">' + esc(label) + (required ? ' *' : '') + '</label>' +
      '<input id="f-' + name + '" name="' + name + '" type="' + type + '"' +
      (value ? ' value="' + esc(value) + '"' : '') +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') +
      (required ? ' required' : '') +
      (type === 'number' ? ' min="100"' : '') + '>' +
      '<div class="error-msg">This field is required</div>' +
    '</div>';
  }

  function fieldSelect(label, name, options, value, required) {
    var html = '<div class="field">' +
      '<label for="f-' + name + '">' + esc(label) + (required ? ' *' : '') + '</label>' +
      '<select id="f-' + name + '" name="' + name + '"' + (required ? ' required' : '') + '>' +
      '<option value="">Select...</option>';
    options.forEach(function (opt) {
      html += '<option value="' + esc(opt) + '"' + (value === opt ? ' selected' : '') + '>' + esc(opt) + '</option>';
    });
    html += '</select><div class="error-msg">Please select an option</div></div>';
    return html;
  }

  function fieldTextarea(label, name, value, placeholder) {
    return '<div class="field full-width">' +
      '<label for="f-' + name + '">' + esc(label) + '</label>' +
      '<textarea id="f-' + name + '" name="' + name + '" rows="4"' +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + '>' +
      (value ? esc(value) : '') + '</textarea></div>';
  }

  function handleGenerate() {
    // Validate
    var valid = true;
    var required = ['clientName', 'email', 'projectType', 'sqft', 'timeline'];
    required.forEach(function (k) {
      var el = document.querySelector('[name="' + k + '"]');
      var field = el.closest('.field');
      if (!el.value.trim()) { field.classList.add('has-error'); valid = false; }
      else { field.classList.remove('has-error'); }
    });
    if (!valid) return;

    // Save form
    root.querySelectorAll('input, select, textarea').forEach(function (el) { state.form[el.name] = el.value; });

    // Generate
    var f = state.form;
    var sqft = parseFloat(f.sqft);
    var tpl = TEMPLATES[f.projectType];
    if (!tpl) return;

    var lineItems = [];
    var runningSubtotal = 0;

    // First pass: sqft & lump items
    tpl.items.forEach(function (item) {
      if (item.unit === 'pct') return;
      var variedRate = item.rate * rand(0.92, 1.08);
      var amount;
      if (item.unit === 'sqft') {
        amount = variedRate * sqft;
        lineItems.push({ name: item.name, qty: sqft.toLocaleString() + ' sqft', rate: fmtFull(variedRate) + '/sqft', amount: amount });
      } else {
        amount = variedRate;
        lineItems.push({ name: item.name, qty: '1 LS', rate: fmtFull(variedRate), amount: amount });
      }
      runningSubtotal += amount;
    });

    // Timeline surcharge
    var surchargeRate = TIMELINE_SURCHARGE[f.timeline] || 0;
    if (surchargeRate > 0) {
      var surchargeAmt = runningSubtotal * surchargeRate;
      lineItems.push({ name: 'Timeline Acceleration (' + f.timeline + ')', qty: '', rate: pct(surchargeRate), amount: surchargeAmt });
      runningSubtotal += surchargeAmt;
    }

    // Percentage items (PM, General Conditions)
    tpl.items.forEach(function (item) {
      if (item.unit !== 'pct') return;
      var amount = runningSubtotal * item.rate;
      lineItems.push({ name: item.name + ' (' + pct(item.rate) + ')', qty: '', rate: pct(item.rate), amount: amount });
      runningSubtotal += amount;
    });

    var subtotal = runningSubtotal;
    var contingencyAmt = subtotal * tpl.contingency;
    var taxable = subtotal + contingencyAmt;
    var gst = taxable * 0.05;
    var total = taxable + gst;

    state.estimate = {
      number: genId(),
      date: today(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      client: f,
      lineItems: lineItems,
      subtotal: subtotal,
      contingencyRate: tpl.contingency,
      contingency: contingencyAmt,
      gst: gst,
      total: total
    };

    // Add to quotes list as Draft
    state.quotes = [
      { id: state.estimate.number, client: f.clientName, company: f.company || '—', project: f.projectType, value: total, status: 'Draft', date: today() }
    ].concat(DUMMY_QUOTES);

    nav('estimate');
  }

  /* ───────── View 2: Generated Estimate ───────── */
  function renderEstimate() {
    var e = state.estimate;
    if (!e) { nav('builder'); return; }
    var c = e.client;

    var rowsHtml = '';
    e.lineItems.forEach(function (li) {
      rowsHtml += '<tr><td>' + esc(li.name) + '</td><td>' + esc(li.qty) + '</td><td>' + esc(li.rate) + '</td><td>' + fmtFull(li.amount) + '</td></tr>';
    });

    root.innerHTML =
      '<div class="no-print btn-group" style="margin-bottom:24px;margin-top:0">' +
        '<button class="btn btn-ghost btn-sm" onclick="window._quoteNav(\'builder\')">&larr; Back to Builder</button>' +
      '</div>' +
      '<div id="estimate-printable" class="estimate-doc">' +
        '<div class="est-header">' +
          '<div class="est-logo">' +
            '<img src="/assets/n5-logo.png" alt="N5 Builds">' +
            '<div class="est-tagline">Spaces that Inspire</div>' +
          '</div>' +
          '<div class="est-meta">' +
            '<div class="est-number">' + esc(e.number) + '</div>' +
            '<p>Date: ' + esc(e.date) + '</p>' +
            '<p>Valid until: ' + esc(e.validUntil) + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="est-client">' +
          '<div>' +
            '<h4>Prepared For</h4>' +
            '<p><strong>' + esc(c.clientName) + '</strong></p>' +
            (c.company ? '<p>' + esc(c.company) + '</p>' : '') +
            '<p>' + esc(c.email) + '</p>' +
            (c.phone ? '<p>' + esc(c.phone) + '</p>' : '') +
          '</div>' +
          '<div>' +
            '<h4>Project Details</h4>' +
            '<p><strong>' + esc(c.projectType) + '</strong></p>' +
            '<p>' + parseInt(c.sqft).toLocaleString() + ' sq ft</p>' +
            '<p>Timeline: ' + esc(c.timeline) + '</p>' +
            (c.scope ? '<p style="margin-top:8px;font-size:0.85rem;color:#666">' + esc(c.scope) + '</p>' : '') +
          '</div>' +
        '</div>' +

        '<table class="est-table">' +
          '<thead><tr><th>Description</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +

        '<div class="est-summary">' +
          '<div class="est-summary-row"><span>Subtotal</span><span>' + fmtFull(e.subtotal) + '</span></div>' +
          '<div class="est-summary-row"><span>Contingency (' + pct(e.contingencyRate) + ')</span><span>' + fmtFull(e.contingency) + '</span></div>' +
          '<div class="est-summary-row"><span>GST (5%)</span><span>' + fmtFull(e.gst) + '</span></div>' +
          '<div class="est-summary-row total"><span>Total</span><span>' + fmtFull(e.total) + '</span></div>' +
        '</div>' +

        '<div class="est-footer">' +
          '<div class="est-footer-note">This estimate is for budgetary purposes only. Final pricing subject to detailed scope review, site conditions, and permit requirements. All amounts in CAD.</div>' +
          '<div class="est-footer-contact">' +
            '<img src="/assets/n5-logo-alt.png" alt="N5 Builds">' +
            '<div>Nadeem@n5builds.com</div>' +
            '<div>+1 (604) 499-4288</div>' +
            '<div>Vancouver, BC</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="no-print btn-group" style="margin-top:24px">' +
        '<button class="btn btn-primary" id="download-btn">Download PDF</button>' +
        '<button class="btn btn-ghost" id="send-btn">Send to Client</button>' +
        '<button class="btn btn-ghost" onclick="window._quoteNav(\'dashboard\')">View Dashboard</button>' +
      '</div>';

    document.getElementById('download-btn').addEventListener('click', downloadPdf);
    document.getElementById('send-btn').addEventListener('click', function () {
      showToast('Estimate ' + e.number + ' sent to ' + esc(e.client.email));
    });
  }

  function downloadPdf() {
    var el = document.getElementById('estimate-printable');
    if (!el || typeof html2pdf === 'undefined') { alert('PDF library not loaded. Please try again.'); return; }
    var opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: state.estimate.number + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
  }

  /* ───────── View 3: Dashboard ───────── */
  function renderDashboard() {
    var q = state.quotes;

    // Stats
    var now = new Date();
    var thisMonth = q.filter(function (x) { var d = new Date(x.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    var decided = q.filter(function (x) { return x.status === 'Accepted' || x.status === 'Declined' || x.status === 'Expired'; });
    var won = q.filter(function (x) { return x.status === 'Accepted'; });
    var pipeline = q.filter(function (x) { return x.status === 'Sent' || x.status === 'Viewed' || x.status === 'Draft'; });
    var pipelineTotal = pipeline.reduce(function (s, x) { return s + x.value; }, 0);
    var avgVal = q.length ? q.reduce(function (s, x) { return s + x.value; }, 0) / q.length : 0;
    var winRate = decided.length ? won.length / decided.length : 0;

    var rowsHtml = '';
    q.forEach(function (x) {
      var badgeClass = 'badge-' + x.status.toLowerCase();
      rowsHtml += '<tr>' +
        '<td style="font-weight:600">' + esc(x.id) + '</td>' +
        '<td>' + esc(x.client) + '</td>' +
        '<td>' + esc(x.company) + '</td>' +
        '<td>' + esc(x.project) + '</td>' +
        '<td class="amount">' + fmt(x.value) + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + esc(x.status) + '</span></td>' +
        '<td>' + esc(x.date) + '</td>' +
      '</tr>';
    });

    root.innerHTML =
      '<div class="section-header">' +
        '<h1>Quote Dashboard</h1>' +
        '<button class="btn btn-primary btn-sm" onclick="window._quoteNav(\'builder\')">+ New Quote</button>' +
      '</div>' +

      '<div class="stats-grid">' +
        statCard('Quotes This Month', thisMonth.length, '') +
        statCard('Win Rate', pct(winRate), won.length + ' of ' + decided.length + ' decided') +
        statCard('Avg Project Value', fmt(avgVal), '') +
        statCard('Pipeline Total', fmt(pipelineTotal), pipeline.length + ' active quotes') +
      '</div>' +

      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr>' +
            '<th>Estimate #</th><th>Client</th><th>Company</th><th>Project</th>' +
            '<th class="amount">Value</th><th>Status</th><th>Date</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function statCard(label, value, sub) {
    return '<div class="stat-card">' +
      '<div class="stat-label">' + esc(label) + '</div>' +
      '<div class="stat-value">' + value + '</div>' +
      (sub ? '<div class="stat-sub">' + esc(sub) + '</div>' : '') +
    '</div>';
  }

  /* ───────── Toast ───────── */
  function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'toast success';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3500);
  }

  /* ───────── Global Nav Binding ───────── */
  window._quoteNav = nav;

  /* ───────── Init ───────── */
  document.addEventListener('DOMContentLoaded', function () {
    root = document.querySelector('[data-quote-app]');
    // Bind nav links
    document.querySelectorAll('.nav-link[data-view]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); nav(el.dataset.view); });
    });
    render();
  });

})();
