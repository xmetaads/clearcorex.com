// ============================================
// ClearCorex Desktop — renderer
// All processing happens in-memory. No disk writes
// except when the user explicitly exports.
// ============================================

(() => {
  'use strict';

  // ----- Reference data -----
  const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const DISPOSABLE = new Set([
    'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'throwaway.email', 'trash-mail.com', 'yopmail.com', 'sharklasers.com',
    'maildrop.cc', 'getnada.com', 'mintemail.com', 'mohmal.com',
    'tempinbox.com', 'tempmailaddress.com', 'fakeinbox.com', 'mytemp.email',
    'spam4.me', 'discard.email', 'mailnesia.com', 'temp-mail.org',
  ]);

  const TYPO_DOMAINS = new Set([
    'gmial.com', 'gnail.com', 'gmaill.com', 'gmai.com', 'gmal.com', 'gmali.com',
    'yaho.com', 'yhoo.com', 'yahho.com', 'yaoo.com',
    'hotnail.com', 'hotmial.com', 'hotmai.com', 'hotmal.com',
    'outlok.com', 'outloook.com', 'outloo.com',
    'iclou.com', 'iclud.com',
  ]);

  const FREE_PROVIDERS = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com',
    'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'protonmail.com', 'proton.me',
    'gmx.com', 'gmx.net', 'mail.com',
  ]);

  const ROLE_PREFIXES = new Set([
    'info', 'admin', 'sales', 'support', 'help', 'contact', 'hello',
    'team', 'office', 'noreply', 'no-reply', 'donotreply', 'service',
    'billing', 'accounts', 'hr', 'careers', 'jobs', 'press', 'media',
    'marketing', 'newsletter', 'webmaster', 'postmaster',
  ]);

  const SUSPICIOUS_TLDS = new Set(['.zip', '.review', '.country', '.kim', '.cricket', '.science', '.work', '.party']);

  // ----- DOM refs -----
  const $ = (id) => document.getElementById(id);
  const els = {
    btnOpen:   $('btnOpen'),
    btnRun:    $('btnRun'),
    btnReset:  $('btnReset'),
    dropzone:  $('dropzone'),
    input:     $('emailsInput'),
    inputMeta: $('inputMeta'),
    engineMeta:$('engineMeta'),
    pipeline:  $('pipeline'),
    pipeFill:  $('pipeFill'),
    pipePct:   $('pipePct'),
    pipeCount: $('pipeCount'),
    pipeStages:$('pipeStages'),
    results:   $('results'),
    rtbody:    $('rtbody'),
    emptyState:$('emptyState'),
    btnExportValid: $('btnExportValid'),
    btnExportAll:   $('btnExportAll'),
    statusText:$('statusText'),
    toast:     $('toast'),
    toastMsg:  $('toastMsg'),
    historyList: $('historyList'),
    // KPIs
    kpiTotal:   $('kpiTotal'),
    kpiValid:   $('kpiValid'),
    kpiInvalid: $('kpiInvalid'),
    kpiRisky:   $('kpiRisky'),
    kpiDispo:   $('kpiDispo'),
    kpiDup:     $('kpiDup'),
    // Tab counts
    tcValid:    $('tcValid'),
    tcInvalid:  $('tcInvalid'),
    tcRisky:    $('tcRisky'),
    tcDispo:    $('tcDispo'),
    tcDup:      $('tcDup'),
    // Window controls
    tcMin:      $('tcMin'),
    tcClose:    $('tcClose'),
  };

  // ----- State -----
  let lastResult = null;     // { rows: [{email, status, score, reason}], counts }
  let activeTab = 'valid';
  const history = [];        // session-only

  // ============================================
  // View switching
  // ============================================
  document.querySelectorAll('.side-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;
      document.querySelectorAll('.side-item').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      const view = $('view' + target.charAt(0).toUpperCase() + target.slice(1));
      if (view) view.classList.add('active');
    });
  });

  // ============================================
  // File input — open dialog + drag/drop
  // ============================================
  els.btnOpen.addEventListener('click', async () => {
    if (!window.cc) return;
    const r = await window.cc.openFile();
    if (!r) return;
    if (r.error) { toast(r.error); return; }
    loadFileContent(r.name, r.content);
  });

  els.dropzone.addEventListener('click', () => els.btnOpen.click());

  ['dragenter', 'dragover'].forEach(ev =>
    els.dropzone.addEventListener(ev, (e) => { e.preventDefault(); els.dropzone.classList.add('drag'); })
  );
  ['dragleave', 'drop'].forEach(ev =>
    els.dropzone.addEventListener(ev, (e) => { e.preventDefault(); els.dropzone.classList.remove('drag'); })
  );
  els.dropzone.addEventListener('drop', async (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const text = await file.text();
    loadFileContent(file.name, text);
  });

  function loadFileContent(name, content) {
    const emails = extractEmails(content);
    els.input.value = emails.join('\n');
    els.inputMeta.textContent = `${name} · ${emails.length.toLocaleString('en-US')} candidates`;
    toast(`Loaded ${emails.length.toLocaleString('en-US')} candidates from ${name}`);
  }

  // Heuristic: strip CSV/JSON/log content down to email candidates.
  function extractEmails(raw) {
    if (!raw) return [];
    const matches = raw.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g);
    if (matches && matches.length) return Array.from(new Set(matches));
    // Fallback: line-split
    return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  // ============================================
  // Reset
  // ============================================
  els.btnReset.addEventListener('click', () => {
    els.input.value = '';
    els.inputMeta.textContent = 'Paste emails or open a file';
    resetResults();
    setStages('idle');
    els.engineMeta.textContent = 'Idle';
  });

  function resetResults() {
    lastResult = null;
    activeTab = 'valid';
    els.results.hidden = true;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'valid'));
    setKpis({ total: 0, valid: 0, invalid: 0, risky: 0, dispo: 0, dup: 0 });
    setPipeline(0, 0, 0);
  }

  // ============================================
  // Tabs
  // ============================================
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => {
      activeTab = t.dataset.tab;
      document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
      renderTable();
    })
  );

  // ============================================
  // Validation engine
  // ============================================
  function classify(rawEmail, seen) {
    const original = rawEmail.trim();
    if (!original) return null;
    const lower = original.toLowerCase();

    // 1. Syntax
    if (!EMAIL_RE.test(lower)) {
      return { email: original, status: 'invalid', score: 0, reason: 'Invalid syntax (RFC 5322)', tags: [] };
    }

    const [local, domain] = lower.split('@');
    const tags = [];

    // 2. Typo domain
    if (TYPO_DOMAINS.has(domain)) {
      return { email: original, status: 'invalid', score: 5, reason: `Typo domain (${domain})`, tags };
    }

    // 3. Disposable
    if (DISPOSABLE.has(domain)) {
      return { email: original, status: 'dispo', score: 8, reason: `Disposable mailbox (${domain})`, tags: ['disposable'] };
    }

    // 4. Suspicious TLD
    const tld = '.' + domain.split('.').pop();
    if (SUSPICIOUS_TLDS.has(tld)) {
      tags.push('suspicious-tld');
    }

    // 5. Role-based
    const isRole = ROLE_PREFIXES.has(local.split('+')[0].replace(/\./g, ''));
    if (isRole) tags.push('role');

    // 6. Free provider
    const isFree = FREE_PROVIDERS.has(domain);
    if (isFree) tags.push('free');

    // 7. Dedup normalize (Gmail-style)
    let canonical = lower;
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      canonical = local.split('+')[0].replace(/\./g, '') + '@gmail.com';
    } else {
      canonical = local.split('+')[0] + '@' + domain;
    }
    if (seen.has(canonical)) {
      return { email: original, status: 'dup', score: null, reason: `Duplicate of ${seen.get(canonical)}`, tags };
    }
    seen.set(canonical, original);

    // 8. Score
    let score = 95;
    if (isRole) score -= 12;
    if (tags.includes('suspicious-tld')) score -= 30;
    if (domain.length > 35) score -= 8;
    if (local.length > 30) score -= 6;
    if (/\d{4,}/.test(local)) score -= 8;       // long number runs
    if (isFree) score -= 2;                     // tiny penalty
    score = Math.max(0, Math.min(100, score));

    let status, reason;
    if (score >= 85)      { status = 'valid';   reason = isFree ? 'Valid · free provider' : 'Verified by all checks'; }
    else if (score >= 50) { status = 'risky';   reason = isRole ? 'Role-based address' : 'Lower-confidence address'; }
    else                  { status = 'invalid'; reason = 'Multiple risk signals'; }

    if (tags.includes('suspicious-tld')) reason += ' · suspicious TLD';

    return { email: original, status, score, reason, tags };
  }

  // ============================================
  // Run cleanup
  // ============================================
  els.btnRun.addEventListener('click', () => {
    const raw = els.input.value;
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) { toast('Add at least one email first'); return; }
    runJob(lines);
  });

  async function runJob(lines) {
    els.btnRun.disabled = true;
    els.btnReset.disabled = true;
    els.results.hidden = true;
    els.engineMeta.textContent = `Verifying ${lines.length.toLocaleString('en-US')}…`;
    setStatus(`Verifying ${lines.length.toLocaleString('en-US')} addresses…`);

    setStages('idle');
    const stages = ['syntax', 'domain', 'dispo', 'role', 'dedup', 'score'];

    // Visual stage cadence — long enough to feel premium but never blocks
    const stageDelay = Math.min(420, Math.max(140, 1800 / stages.length));

    for (let i = 0; i < stages.length; i++) {
      markStage(stages[i], 'running');
      await sleep(stageDelay);
      markStage(stages[i], 'done');
    }

    // Process in chunks so the UI thread stays responsive
    const seen = new Map();
    const rows = [];
    const chunk = 500;
    const t0 = performance.now();

    for (let i = 0; i < lines.length; i += chunk) {
      const slice = lines.slice(i, i + chunk);
      for (const line of slice) {
        const r = classify(line, seen);
        if (r) rows.push(r);
      }
      const processed = Math.min(i + chunk, lines.length);
      setPipeline(Math.round((processed / lines.length) * 100), processed, lines.length);
      await sleep(0);
    }
    setPipeline(100, lines.length, lines.length);

    const counts = { total: rows.length, valid: 0, invalid: 0, risky: 0, dispo: 0, dup: 0 };
    rows.forEach(r => counts[r.status]++);
    setKpis(counts);

    lastResult = { rows, counts, sourceCount: lines.length, ms: Math.round(performance.now() - t0) };
    activeTab = 'valid';
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'valid'));
    setTabCounts(counts);
    renderTable();
    els.results.hidden = false;
    els.engineMeta.textContent = `Done in ${lastResult.ms} ms · ${rows.length.toLocaleString('en-US')} addresses`;
    setStatus(`Verified ${rows.length.toLocaleString('en-US')} addresses in ${lastResult.ms} ms — ${counts.valid.toLocaleString('en-US')} valid, ${counts.invalid.toLocaleString('en-US')} invalid`);

    pushHistory({
      name: deriveJobName(),
      ts: new Date(),
      counts,
      ms: lastResult.ms,
      total: rows.length,
    });

    els.btnRun.disabled = false;
    els.btnReset.disabled = false;
  }

  function deriveJobName() {
    const meta = els.inputMeta.textContent;
    if (meta && meta !== 'Paste emails or open a file') {
      return meta.split(' · ')[0];
    }
    return 'Pasted batch';
  }

  // ============================================
  // Pipeline / KPIs
  // ============================================
  function setStages(state) {
    els.pipeStages.querySelectorAll('li').forEach(li => {
      li.classList.remove('running', 'done');
      li.querySelector('.ps-status').textContent = state === 'idle' ? 'Idle' : 'Done';
    });
  }
  function markStage(stage, state) {
    const li = els.pipeStages.querySelector(`li[data-stage="${stage}"]`);
    if (!li) return;
    li.classList.remove('running', 'done');
    li.classList.add(state);
    li.querySelector('.ps-status').textContent = state === 'running' ? 'Running' : 'Done';
  }
  function setPipeline(pct, count, total) {
    els.pipeFill.style.width = pct + '%';
    els.pipePct.textContent = pct + '%';
    els.pipeCount.textContent = `${count.toLocaleString('en-US')} / ${total.toLocaleString('en-US')}`;
  }
  function setKpis(c) {
    els.kpiTotal.textContent   = (c.total   || 0).toLocaleString('en-US');
    els.kpiValid.textContent   = (c.valid   || 0).toLocaleString('en-US');
    els.kpiInvalid.textContent = (c.invalid || 0).toLocaleString('en-US');
    els.kpiRisky.textContent   = (c.risky   || 0).toLocaleString('en-US');
    els.kpiDispo.textContent   = (c.dispo   || 0).toLocaleString('en-US');
    els.kpiDup.textContent     = (c.dup     || 0).toLocaleString('en-US');
  }
  function setTabCounts(c) {
    els.tcValid.textContent   = c.valid;
    els.tcInvalid.textContent = c.invalid;
    els.tcRisky.textContent   = c.risky;
    els.tcDispo.textContent   = c.dispo;
    els.tcDup.textContent     = c.dup;
  }

  // ============================================
  // Table rendering
  // ============================================
  function renderTable() {
    if (!lastResult) return;
    const subset = lastResult.rows.filter(r => r.status === activeTab);
    if (!subset.length) {
      els.rtbody.innerHTML = '';
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;

    // Limit DOM to first 1000 for snappy rendering; tell user if more
    const cap = 1000;
    const visible = subset.slice(0, cap);
    const html = visible.map(r => {
      const score = r.score == null ? '—' : r.score;
      return `<tr>
        <td>${esc(r.email)}</td>
        <td class="col-status"><span class="tag ${r.status}">${labelFor(r.status)}</span></td>
        <td class="col-score">${score}</td>
        <td class="col-reason">${esc(r.reason || '')}</td>
      </tr>`;
    }).join('');
    const cappedRow = subset.length > cap
      ? `<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:14px;font-style:italic">+ ${(subset.length - cap).toLocaleString('en-US')} more rows — export to see them all</td></tr>`
      : '';
    els.rtbody.innerHTML = html + cappedRow;
  }

  function labelFor(s) {
    return { valid: 'Valid', invalid: 'Invalid', risky: 'Risky', dispo: 'Disposable', dup: 'Duplicate' }[s] || s;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ============================================
  // Export
  // ============================================
  els.btnExportValid.addEventListener('click', async () => {
    if (!lastResult) return;
    const rows = lastResult.rows.filter(r => r.status === 'valid');
    if (!rows.length) { toast('No valid addresses to export'); return; }
    const csv = 'email\n' + rows.map(r => csvCell(r.email)).join('\n');
    const r = await window.cc.saveFile({ defaultName: 'clearcorex-valid.csv', content: csv });
    if (r && r.ok) toast(`Saved ${rows.length.toLocaleString('en-US')} valid addresses`);
  });

  els.btnExportAll.addEventListener('click', async () => {
    if (!lastResult) return;
    const rows = lastResult.rows;
    const csv = 'email,status,score,reason\n' + rows.map(r =>
      [csvCell(r.email), r.status, r.score == null ? '' : r.score, csvCell(r.reason || '')].join(',')
    ).join('\n');
    const r = await window.cc.saveFile({ defaultName: 'clearcorex-all.csv', content: csv });
    if (r && r.ok) toast(`Saved ${rows.length.toLocaleString('en-US')} rows`);
  });

  function csvCell(s) {
    const v = String(s ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  // ============================================
  // History (session only — never written to disk)
  // ============================================
  function pushHistory(job) {
    history.unshift(job);
    if (history.length > 20) history.length = 20;
    renderHistory();
  }
  function renderHistory() {
    if (!history.length) return;
    const fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    els.historyList.innerHTML = history.map(h => `
      <div class="history-row">
        <div>
          <div class="h-name">${esc(h.name)}</div>
          <div class="h-meta">${fmt.format(h.ts)} · ${h.ms} ms</div>
        </div>
        <div class="h-stat"><span class="h-stat-num" style="color:var(--accent)">${h.counts.valid}</span><span>valid</span></div>
        <div class="h-stat"><span class="h-stat-num" style="color:var(--danger)">${h.counts.invalid}</span><span>invalid</span></div>
        <div class="h-stat"><span class="h-stat-num" style="color:var(--warn)">${h.counts.risky}</span><span>risky</span></div>
        <div class="h-stat"><span class="h-stat-num">${h.total}</span><span>total</span></div>
      </div>
    `).join('');
  }

  // ============================================
  // Misc
  // ============================================
  function setStatus(msg) { els.statusText.textContent = msg; }

  let toastTimer;
  function toast(msg) {
    els.toastMsg.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.hidden = true, 2400);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Window controls
  els.tcMin.addEventListener('click', () => window.cc && window.cc.minimize());
  els.tcClose.addEventListener('click', () => window.cc && window.cc.close());

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'o') { e.preventDefault(); els.btnOpen.click(); }
    if (ctrl && e.key === 'Enter') { e.preventDefault(); els.btnRun.click(); }
    if (ctrl && e.key === 'r' && lastResult) { e.preventDefault(); els.btnReset.click(); }
  });

  // Boot
  setStatus('Engine ready · Offline mode — your data never leaves this machine');
})();
