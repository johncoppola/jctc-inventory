// ===== FINANCES TAB =====
// Expenses, recurring templates, mileage log, reimbursement tracking, and a
// monthly P&L that joins sales data (items/lots) with operating expenses.
// Tables: expenses, recurring_expenses, mileage_log (+ app_config.mileage_rate).

const FIN = { expenses: [], recurring: [], mileage: [], mileageRate: 0.70, loaded: false };
let _finTab = 'pl';
let _finYear = new Date().getFullYear();

// Expense-tab filters
let _expMonth = '';
let _expCat = '';
let _expPaidFrom = '';
let _expSearch = '';

// Register finance dropdowns in the shared store so the right-click
// header editor works on them like every other dropdown in the app.
DROPDOWN_OPTIONS.expenseCategory = [
  'Supplies & Packaging',
  'Shipping & Postage',
  'Storage Rent',
  'Software & Subscriptions',
  'Platform & Payment Fees',
  'Phone & Internet (biz %)',
  'Advertising & Promotion',
  'Professional Services',
  'Licenses & Gov Fees',
  'Bank Fees',
  'Equipment & Tools',
  'Vehicle & Gas',
  'Inventory / Lot Purchase',
  'Other'
];
DROPDOWN_OPTIONS.paidFrom = [
  '', 'Business Credit Card', 'Relay Checking', 'Truist Checking',
  'Venmo', 'Cash App', 'Cash',
  'Personal — Venture X', 'Personal — Savings', 'Personal — Other'
];
EDITABLE_DROPDOWNS.push('expenseCategory', 'paidFrom');
DROPDOWN_LABELS.expenseCategory = 'Expense Category';
DROPDOWN_LABELS.paidFrom = 'Paid From';

const REIMB_OPTIONS = ['N/A', 'Owed', 'Reimbursed'];

// Lot purchases logged here are for reimbursement/record tracking only —
// their cost already reaches the P&L through lots -> items COGS.
function _isInventoryCat(c) { return /inventory|lot purchase/i.test(c || ''); }
function _isPersonal(pf) { return /^personal/i.test(pf || ''); }

function finEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _finToday() { return new Date().toISOString().split('T')[0]; }

function _finMonthLabel(key) { // '2026-07' -> 'Jul 2026'
  const d = new Date(key + '-01T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ===== DATA LOADING =====
async function loadFinanceData() {
  try {
    const [expenses, recurring, mileage, rateRows] = await Promise.all([
      supabase.select('expenses', 'order=date.desc,id.desc'),
      supabase.select('recurring_expenses', 'order=day_of_month.asc,id.asc'),
      supabase.select('mileage_log', 'order=date.desc,id.desc'),
      supabase.select('app_config', 'key=eq.mileage_rate')
    ]);
    FIN.expenses = expenses;
    FIN.recurring = recurring;
    FIN.mileage = mileage;
    FIN.mileageRate = rateRows.length ? (parseFloat(rateRows[0].value) || 0.70) : 0.70;
    FIN.loaded = true;
  } catch (err) {
    console.error('loadFinanceData failed:', err);
    toast('Error loading finance data — check console');
  }
}

// ===== TOP-LEVEL RENDER =====
async function renderFinances() {
  if (!FIN.loaded) {
    const c = document.getElementById('finContent');
    if (c) c.innerHTML = '<div class="fin-loading">Loading finances…</div>';
  }
  await loadFinanceData(); // cheap — keeps Monarch/agent-inserted rows fresh
  _updateFinYearSelect();
  updateReimbBadge();
  renderFinSubTab();
}

function renderFinSubTab() {
  document.querySelectorAll('.fin-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.fin === _finTab));
  if (_finTab === 'pl') renderFinPL();
  else if (_finTab === 'expenses') renderFinExpenses();
  else if (_finTab === 'recurring') renderFinRecurring();
  else if (_finTab === 'mileage') renderFinMileage();
  else if (_finTab === 'reimb') renderFinReimb();
}

function setFinTab(t) { _finTab = t; renderFinSubTab(); }

function setFinYear(y) { _finYear = Number(y); _expMonth = ''; renderFinSubTab(); }

function _updateFinYearSelect() {
  const sel = document.getElementById('finYear');
  if (!sel) return;
  const years = new Set([new Date().getFullYear()]);
  DATA.items.forEach(i => { if (i.dateSold) years.add(Number(i.dateSold.slice(0, 4))); });
  DATA.lots.forEach(l => { if (l.date) years.add(Number(l.date.slice(0, 4))); });
  FIN.expenses.forEach(e => { if (e.date) years.add(Number(e.date.slice(0, 4))); });
  FIN.mileage.forEach(m => { if (m.date) years.add(Number(m.date.slice(0, 4))); });
  const list = [...years].filter(y => y > 2000).sort((a, b) => b - a);
  if (!list.includes(_finYear)) _finYear = list[0];
  sel.innerHTML = list.map(y => `<option value="${y}"${y === _finYear ? ' selected' : ''}>${y}</option>`).join('');
}

function updateReimbBadge() {
  const badge = document.getElementById('reimbBadge');
  if (!badge) return;
  const owed = FIN.expenses.filter(e => e.reimbursement_status === 'Owed').length;
  badge.textContent = owed;
  badge.style.display = owed > 0 ? '' : 'none';
}

// ===== P&L =====
function _plMonthKeys(year) {
  const now = new Date();
  const lastMonth = year < now.getFullYear() ? 12
    : year > now.getFullYear() ? 0 : now.getMonth() + 1;
  const keys = new Set();
  for (let m = 1; m <= lastMonth; m++) keys.add(`${year}-${String(m).padStart(2, '0')}`);
  // Include any months that somehow have future/past-dated data in this year
  const y = String(year);
  DATA.items.forEach(i => { if ((i.dateSold || '').startsWith(y)) keys.add(i.dateSold.slice(0, 7)); });
  DATA.lots.forEach(l => { if ((l.date || '').startsWith(y)) keys.add(l.date.slice(0, 7)); });
  FIN.expenses.forEach(e => { if ((e.date || '').startsWith(y)) keys.add(e.date.slice(0, 7)); });
  return [...keys].sort();
}

function buildMonthlyPL(year) {
  DATA.items.forEach(i => calcItem(i));
  const y = String(year);
  const months = {};
  _plMonthKeys(year).forEach(k => {
    months[k] = { rev: 0, cogs: 0, fees: 0, opex: 0, lotSpend: 0 };
  });
  DATA.items.forEach(i => {
    if (!isSold(i) || !(i.dateSold || '').startsWith(y)) return;
    const m = months[i.dateSold.slice(0, 7)];
    if (!m) return;
    m.rev += Number(i.salePrice) || 0;
    m.cogs += i.unitCost || 0;
    m.fees += (Number(i.platformFees) || 0) + (Number(i.shippingCost) || 0) + (Number(i.otherCosts) || 0);
  });
  FIN.expenses.forEach(e => {
    if (!e.in_pl || !(e.date || '').startsWith(y)) return;
    const m = months[e.date.slice(0, 7)];
    if (m) m.opex += Number(e.amount) || 0;
  });
  DATA.lots.forEach(l => {
    if (!(l.date || '').startsWith(y)) return;
    const m = months[l.date.slice(0, 7)];
    if (m) m.lotSpend += Number(l.totalCost) || 0;
  });
  Object.values(months).forEach(m => { m.net = m.rev - m.cogs - m.fees - m.opex; });
  return months;
}

function renderFinPL() {
  const months = buildMonthlyPL(_finYear);
  const keys = Object.keys(months).sort();
  const tot = { rev: 0, cogs: 0, fees: 0, opex: 0, lotSpend: 0, net: 0 };
  keys.forEach(k => { const m = months[k]; ['rev', 'cogs', 'fees', 'opex', 'lotSpend', 'net'].forEach(f => tot[f] += m[f]); });

  const nowKey = _finToday().slice(0, 7);
  const thisMonth = months[nowKey];
  const taxReserve = 0.30 * Math.max(0, tot.net);
  const y = String(_finYear);
  const milesY = FIN.mileage.filter(m => (m.date || '').startsWith(y))
    .reduce((s, m) => s + (Number(m.miles) || 0), 0);
  const mileageDed = milesY * FIN.mileageRate;

  let html = `<div class="dashboard">
    <div class="stat-card"><div class="label">Net Profit (${_finYear})</div><div class="value ${tot.net >= 0 ? 'positive' : 'negative'}">${fmt(tot.net)}</div><div class="sub">Revenue − COGS − fees − expenses</div></div>
    ${thisMonth ? `<div class="stat-card"><div class="label">This Month Net</div><div class="value ${thisMonth.net >= 0 ? 'positive' : 'negative'}">${fmt(thisMonth.net)}</div><div class="sub">${_finMonthLabel(nowKey)}</div></div>` : ''}
    <div class="stat-card"><div class="label">Revenue (${_finYear})</div><div class="value">${fmt(tot.rev)}</div><div class="sub">Items sold this year</div></div>
    <div class="stat-card"><div class="label">Operating Expenses</div><div class="value">${fmt(tot.opex)}</div><div class="sub">Non-COGS spending</div></div>
    <div class="stat-card"><div class="label">Suggested Tax Reserve</div><div class="value">${fmt(taxReserve)}</div><div class="sub">30% of net profit (if positive)</div></div>
    <div class="stat-card"><div class="label">Mileage Deduction Est.</div><div class="value">${fmt(mileageDed)}</div><div class="sub">${milesY.toFixed(1)} mi × $${FIN.mileageRate.toFixed(2)}/mi — not in P&L</div></div>
  </div>`;

  html += `<div class="chart-card" style="margin-bottom:12px">
    <h3 class="chart-title">Monthly P&amp;L <span class="chart-subtitle">${_finYear}</span></h3>
    <div class="chart-container"><canvas id="chartPL"></canvas></div>
  </div>`;

  html += `<div class="table-wrap fin-tablewrap"><table class="fin-table"><thead><tr>
    <th>Month</th><th>Revenue</th><th>COGS (sold)</th><th>Fees &amp; Shipping</th>
    <th>Op. Expenses</th><th>Net Profit</th><th>Margin</th><th>Lot Spend (cash)</th>
  </tr></thead><tbody>`;
  keys.forEach(k => {
    const m = months[k];
    const margin = m.rev > 0 ? m.net / m.rev : null;
    html += `<tr><td>${_finMonthLabel(k)}</td><td>${fmt(m.rev)}</td><td>${fmt(m.cogs)}</td>
      <td>${fmt(m.fees)}</td><td>${fmt(m.opex)}</td>
      <td class="${m.net >= 0 ? 'positive' : 'negative'}">${fmt(m.net)}</td>
      <td>${margin == null ? '-' : fmtPct(margin)}</td>
      <td class="fin-dim">${fmt(m.lotSpend)}</td></tr>`;
  });
  const totMargin = tot.rev > 0 ? tot.net / tot.rev : null;
  html += `<tr class="fin-total-row"><td>Total ${_finYear}</td><td>${fmt(tot.rev)}</td><td>${fmt(tot.cogs)}</td>
    <td>${fmt(tot.fees)}</td><td>${fmt(tot.opex)}</td>
    <td class="${tot.net >= 0 ? 'positive' : 'negative'}">${fmt(tot.net)}</td>
    <td>${totMargin == null ? '-' : fmtPct(totMargin)}</td>
    <td class="fin-dim">${fmt(tot.lotSpend)}</td></tr>`;
  html += '</tbody></table></div>';

  // Expense category breakdown
  const expY = FIN.expenses.filter(e => e.in_pl && (e.date || '').startsWith(y));
  if (expY.length) {
    const byCat = {};
    expY.forEach(e => {
      const c = e.category || '(uncategorized)';
      if (!byCat[c]) byCat[c] = { total: 0, n: 0 };
      byCat[c].total += Number(e.amount) || 0;
      byCat[c].n++;
    });
    html += `<h3 class="fin-section-title">Operating expenses by category — ${_finYear}</h3>
      <div class="table-wrap fin-tablewrap"><table class="fin-table"><thead><tr>
      <th>Category</th><th>Total</th><th>% of Op. Expenses</th><th>Entries</th></tr></thead><tbody>`;
    Object.entries(byCat).sort((a, b) => b[1].total - a[1].total).forEach(([c, v]) => {
      html += `<tr><td>${finEsc(c)}</td><td>${fmt(v.total)}</td>
        <td>${tot.opex > 0 ? fmtPct(v.total / tot.opex) : '-'}</td><td>${v.n}</td></tr>`;
    });
    html += '</tbody></table></div>';
  }

  html += `<p class="fin-note">How to read this: <strong>Revenue</strong> counts items on the date they sold.
    <strong>COGS</strong> is the allocated lot cost of those sold items — a lot bought in March only hits the
    P&amp;L as its items sell. <strong>Lot Spend</strong> shows actual cash paid for lots that month; it is
    informational and NOT subtracted again (that would double-count COGS).
    <strong>Tax reserve</strong> is 30% of net profit per our plan — move it to savings when the business is
    cumulatively profitable. The mileage estimate is a tax deduction, not cash, so it stays out of the P&amp;L.</p>`;

  document.getElementById('finContent').innerHTML = html;
  _renderChartPL(months);
}

function _renderChartPL(months) {
  if (typeof Chart === 'undefined') return;
  const keys = Object.keys(months).sort();
  _destroyChart('chartPL');
  const el = document.getElementById('chartPL');
  if (!el) return;
  if (!keys.length) { el.parentElement.innerHTML = '<div class="chart-empty">No activity this year</div>'; return; }
  _chartInstances['chartPL'] = new Chart(el, {
    type: 'bar',
    data: {
      labels: keys.map(k => _finMonthLabel(k)),
      datasets: [
        { label: 'Revenue', data: keys.map(k => Math.round(months[k].rev * 100) / 100), backgroundColor: CHART_COLORS.accent, borderRadius: 4, maxBarThickness: 40 },
        { label: 'Op. Expenses', data: keys.map(k => Math.round(months[k].opex * 100) / 100), backgroundColor: CHART_COLORS.orange, borderRadius: 4, maxBarThickness: 40 },
        { label: 'Net Profit', data: keys.map(k => Math.round(months[k].net * 100) / 100), type: 'line', borderColor: CHART_COLORS.green, backgroundColor: 'rgba(52,211,153,0.1)', pointBackgroundColor: CHART_COLORS.green, pointRadius: 3, tension: 0.3 }
      ]
    },
    options: {
      ..._chartDefaults(),
      plugins: { ..._chartDefaults().plugins,
        tooltip: { ..._chartDefaults().plugins.tooltip, callbacks: { label: ctx => ctx.dataset.label + ': $' + Number(ctx.raw).toLocaleString() } }
      },
      scales: {
        x: { ..._scaleDefaults().x },
        y: { ..._scaleDefaults().y, ticks: { ..._scaleDefaults().y.ticks, callback: v => '$' + v.toLocaleString() } }
      }
    }
  });
}

// ===== EXPENSES =====
function renderFinExpenses() {
  const y = String(_finYear);
  const monthsWithData = [...new Set(FIN.expenses
    .filter(e => (e.date || '').startsWith(y)).map(e => e.date.slice(0, 7)))].sort().reverse();

  let html = `<div class="toolbar">
    <select id="expMonthFilter" onchange="_expMonth=this.value;renderFinExpTable()">
      <option value="">All of ${_finYear}</option>
      ${monthsWithData.map(m => `<option value="${m}"${m === _expMonth ? ' selected' : ''}>${_finMonthLabel(m)}</option>`).join('')}
    </select>
    <select id="expCatFilter" onchange="_expCat=this.value;renderFinExpTable()">
      <option value="">All Categories</option>
      ${DROPDOWN_OPTIONS.expenseCategory.filter(Boolean).map(c => `<option${c === _expCat ? ' selected' : ''}>${finEsc(c)}</option>`).join('')}
    </select>
    <select id="expPaidFilter" onchange="_expPaidFrom=this.value;renderFinExpTable()">
      <option value="">All Accounts</option>
      ${DROPDOWN_OPTIONS.paidFrom.filter(Boolean).map(p => `<option${p === _expPaidFrom ? ' selected' : ''}>${finEsc(p)}</option>`).join('')}
    </select>
    <input type="search" id="expSearch" placeholder="Search vendor, description..." value="${finEsc(_expSearch)}" oninput="_expSearch=this.value;renderFinExpTable()">
    <span class="fin-filter-total" id="expFilterTotal"></span>
    <div style="flex:1"></div>
    <button class="btn" onclick="exportExpensesCSV()">Export CSV</button>
  </div>
  <div id="finExpTable"></div>
  <p class="fin-note">Lot purchases logged here (category "Inventory / Lot Purchase") are tracked for the record —
    e.g. reimbursements — but excluded from the P&amp;L, since lot costs already flow through the Lots tab as COGS.
    Once the Monarch connection is back, an agent can bulk-import categorized card/bank transactions into this table.</p>`;

  document.getElementById('finContent').innerHTML = html;
  renderFinExpTable();
}

function _filteredExpenses() {
  const y = String(_finYear);
  let rows = FIN.expenses.filter(e => (e.date || '').startsWith(y));
  if (_expMonth) rows = rows.filter(e => (e.date || '').startsWith(_expMonth));
  if (_expCat) rows = rows.filter(e => e.category === _expCat);
  if (_expPaidFrom) rows = rows.filter(e => e.paid_from === _expPaidFrom);
  if (_expSearch) {
    const s = _expSearch.toLowerCase();
    rows = rows.filter(e =>
      (e.vendor || '').toLowerCase().includes(s) ||
      (e.description || '').toLowerCase().includes(s) ||
      (e.notes || '').toLowerCase().includes(s));
  }
  return rows;
}

function _expSelect(id, field, options, current) {
  return `<select onchange="updateExpense(${id},'${field}',this.value)">${options.map(o =>
    `<option value="${finEsc(o)}"${o === (current || '') ? ' selected' : ''}>${finEsc(o)}</option>`).join('')}</select>`;
}

function renderFinExpTable() {
  const rows = _filteredExpenses();
  const total = rows.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalEl = document.getElementById('expFilterTotal');
  if (totalEl) totalEl.textContent = `${rows.length} expense${rows.length === 1 ? '' : 's'} · ${fmt(total)}`;

  let html = `<div class="table-wrap fin-tablewrap"><table class="fin-table"><thead><tr>
    <th>Date</th><th>Amount</th><th data-sort-field="expenseCategory">Category</th><th>Vendor</th>
    <th>Description</th><th data-sort-field="paidFrom">Paid From</th><th>Reimb.</th>
    <th>Receipt</th><th title="Included in P&L">P&amp;L</th><th>Del</th>
  </tr></thead><tbody>`;
  rows.forEach(e => {
    const srcTag = e.source && e.source !== 'manual'
      ? `<span class="fin-src-tag" title="Added by: ${finEsc(e.source)}">${finEsc(e.source)}</span>` : '';
    const receiptBtns = (e.receipt_url
      ? `<a href="${finEsc(e.receipt_url)}" target="_blank" rel="noopener" class="fin-receipt-link" title="Open receipt">↗</a>` : '')
      + `<button class="fin-receipt-btn ${e.receipt_url ? 'has-url' : ''}" onclick="setExpenseReceipt(${e.id})" title="${e.receipt_url ? 'Edit receipt link' : 'Attach receipt link (Google Drive URL)'}">📎</button>`;
    html += `<tr>
      <td><input type="date" value="${finEsc(e.date || '')}" onchange="updateExpense(${e.id},'date',this.value)"></td>
      <td class="money-cell">$<input type="text" inputmode="decimal" value="${e.amount || ''}" onchange="updateExpense(${e.id},'amount',this.value)"></td>
      <td>${_expSelect(e.id, 'category', ['', ...DROPDOWN_OPTIONS.expenseCategory.filter(Boolean)], e.category)}</td>
      <td><input type="text" value="${finEsc(e.vendor)}" onchange="updateExpense(${e.id},'vendor',this.value)"></td>
      <td><input type="text" value="${finEsc(e.description)}" onchange="updateExpense(${e.id},'description',this.value)">${srcTag}</td>
      <td>${_expSelect(e.id, 'paid_from', DROPDOWN_OPTIONS.paidFrom, e.paid_from)}</td>
      <td>${_expSelect(e.id, 'reimbursement_status', REIMB_OPTIONS, e.reimbursement_status)}</td>
      <td class="fin-receipt-cell">${receiptBtns}</td>
      <td style="text-align:center"><input type="checkbox" ${e.in_pl ? 'checked' : ''} onchange="updateExpense(${e.id},'in_pl',this.checked)" title="Uncheck to keep this expense out of the P&L (record only)"></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteExpense(${e.id})">X</button></td>
    </tr>`;
  });
  if (!rows.length) {
    html += `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-dim)">
      No expenses ${_expMonth || _expCat || _expPaidFrom || _expSearch ? 'match these filters' : `logged for ${_finYear} yet — click "+ Expense" above to add one`}.
    </td></tr>`;
  }
  html += '</tbody></table></div>';
  document.getElementById('finExpTable').innerHTML = html;
}

function updateExpense(id, field, value) {
  const e = FIN.expenses.find(x => x.id === id);
  if (!e) return;
  const patch = {};
  if (field === 'amount') {
    e.amount = Number(value) || 0;
    patch.amount = e.amount;
  } else if (field === 'date') {
    if (!value) { renderFinExpTable(); return; } // date is required
    e.date = value;
    patch.date = value;
  } else if (field === 'in_pl') {
    e.in_pl = !!value;
    patch.in_pl = e.in_pl;
  } else {
    e[field] = value;
    patch[field] = value;
  }
  // Cascades that keep the bookkeeping honest
  let cascaded = false;
  if (field === 'category') {
    const shouldExclude = _isInventoryCat(e.category);
    if (shouldExclude && e.in_pl) {
      e.in_pl = false; patch.in_pl = false; cascaded = true;
      toast('Lot purchase — excluded from P&L (already counted as COGS)');
    } else if (!shouldExclude && !e.in_pl) {
      e.in_pl = true; patch.in_pl = true; cascaded = true;
    }
  }
  if (field === 'paid_from') {
    if (_isPersonal(e.paid_from) && e.reimbursement_status === 'N/A') {
      e.reimbursement_status = 'Owed'; patch.reimbursement_status = 'Owed'; cascaded = true;
      toast('Paid from personal funds — marked "Owed" for reimbursement');
    } else if (!_isPersonal(e.paid_from) && e.reimbursement_status === 'Owed') {
      e.reimbursement_status = 'N/A'; patch.reimbursement_status = 'N/A'; cascaded = true;
    }
  }
  if (field === 'reimbursement_status') {
    e.reimbursed_date = value === 'Reimbursed' ? _finToday() : null;
    patch.reimbursed_date = e.reimbursed_date;
  }
  const timerKey = `exp_${id}_${field}`;
  clearTimeout(_updateTimers[timerKey]);
  _updateTimers[timerKey] = setTimeout(async () => {
    try {
      await supabase.update('expenses', `id=eq.${id}`, patch);
    } catch (err) {
      console.error(`updateExpense(${id}, ${field}) error:`, err);
      toast('Error saving expense — check console');
    }
  }, 300);
  if (cascaded || field === 'reimbursement_status') renderFinExpTable();
  updateReimbBadge();
}

async function setExpenseReceipt(id) {
  const e = FIN.expenses.find(x => x.id === id);
  if (!e) return;
  const input = prompt('Paste the receipt link (e.g. Google Drive URL):', e.receipt_url || '');
  if (input === null) return;
  const url = input.trim();
  if (url && !/^https?:\/\//i.test(url)) { toast('URL must start with http:// or https://'); return; }
  e.receipt_url = url;
  try {
    await supabase.update('expenses', `id=eq.${id}`, { receipt_url: url });
    toast(url ? 'Receipt link saved' : 'Receipt link cleared');
    renderFinExpTable();
  } catch (err) {
    console.error('setExpenseReceipt failed:', err);
    toast('Error saving receipt link');
  }
}

async function deleteExpense(id) {
  const e = FIN.expenses.find(x => x.id === id);
  if (!e) return;
  if (!confirm(`Delete this expense (${fmt(e.amount)} — ${e.vendor || e.category || 'no vendor'})? This cannot be undone.`)) return;
  try {
    await supabase.delete('expenses', `id=eq.${id}`);
    FIN.expenses = FIN.expenses.filter(x => x.id !== id);
    renderFinExpTable();
    updateReimbBadge();
    toast('Expense deleted');
  } catch (err) {
    console.error('deleteExpense error:', err);
    toast('Error deleting expense — check console');
  }
}

function exportExpensesCSV() {
  const rows = _filteredExpenses();
  const headers = ['Date', 'Amount', 'Category', 'Vendor', 'Description', 'Paid From', 'Reimbursement', 'Reimbursed On', 'Receipt URL', 'In P&L', 'Source', 'Notes'];
  const csvRows = rows.map(e => [
    e.date, e.amount, e.category, e.vendor, e.description, e.paid_from,
    e.reimbursement_status, e.reimbursed_date || '', e.receipt_url, e.in_pl ? 'Yes' : 'No', e.source, e.notes
  ].map(v => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `jctc_expenses_${_finYear}${_expMonth ? '_' + _expMonth : ''}.csv`;
  a.click();
  toast('Expenses exported!');
}

// ===== ADD EXPENSE MODAL =====
function showExpenseModal() {
  // Make sure the Finances tab data is there even if opened from elsewhere
  document.getElementById('expDate').value = _finToday();
  document.getElementById('expAmount').value = '';
  document.getElementById('expVendor').value = '';
  document.getElementById('expDescription').value = '';
  document.getElementById('expReceipt').value = '';
  populateModalSelect('expCategory', DROPDOWN_OPTIONS.expenseCategory, DROPDOWN_OPTIONS.expenseCategory[0]);
  populateModalSelect('expPaidFrom', DROPDOWN_OPTIONS.paidFrom, 'Business Credit Card');
  populateModalSelect('expReimb', REIMB_OPTIONS, 'N/A');
  document.getElementById('expInPl').checked = true;
  document.getElementById('expenseModal').classList.add('show');
}

function closeExpenseModal() { document.getElementById('expenseModal').classList.remove('show'); }

// Auto-rules while filling the form (both stay user-overridable)
function _expModalCategoryChanged() {
  document.getElementById('expInPl').checked = !_isInventoryCat(document.getElementById('expCategory').value);
}
function _expModalPaidFromChanged() {
  const sel = document.getElementById('expReimb');
  sel.value = _isPersonal(document.getElementById('expPaidFrom').value) ? 'Owed' : 'N/A';
}

async function saveExpense() {
  const date = document.getElementById('expDate').value;
  const amount = Number(document.getElementById('expAmount').value) || 0;
  if (!date) { alert('Date is required.'); return; }
  if (!amount) { alert('Amount is required.'); return; }
  const receipt = document.getElementById('expReceipt').value.trim();
  if (receipt && !/^https?:\/\//i.test(receipt)) { alert('Receipt link must start with http:// or https://'); return; }
  const status = document.getElementById('expReimb').value;
  const row = {
    date,
    amount,
    category: document.getElementById('expCategory').value,
    vendor: document.getElementById('expVendor').value.trim(),
    description: document.getElementById('expDescription').value.trim(),
    paid_from: document.getElementById('expPaidFrom').value,
    reimbursement_status: status,
    reimbursed_date: status === 'Reimbursed' ? _finToday() : null,
    receipt_url: receipt,
    in_pl: document.getElementById('expInPl').checked,
    source: 'manual'
  };
  try {
    const inserted = await supabase.insert('expenses', row);
    const saved = Array.isArray(inserted) ? inserted[0] : inserted;
    if (saved && saved.id) FIN.expenses.unshift(saved);
    closeExpenseModal();
    updateReimbBadge();
    renderFinSubTab();
    toast(`Expense added — ${fmt(amount)}`);
  } catch (err) {
    console.error('saveExpense error:', err);
    toast('Error saving expense — check console');
  }
}

// ===== RECURRING EXPENSES =====
function _recurringPostedThisMonth(rid) {
  const mk = _finToday().slice(0, 7);
  return FIN.expenses.find(e => e.recurring_id === rid && (e.date || '').startsWith(mk));
}

function renderFinRecurring() {
  const due = FIN.recurring.filter(r => r.active && !_recurringPostedThisMonth(r.id)).length;
  let html = `<div class="toolbar">
    <button class="btn btn-primary" onclick="showRecurringModal()">+ Recurring Expense</button>
    <button class="btn" onclick="postAllDueRecurring()" ${due ? '' : 'disabled'}>Post all due this month${due ? ` (${due})` : ''}</button>
    <span class="fin-filter-total">Templates for storage rent, subscriptions, etc. — one click posts them to the expense log each month.</span>
  </div>
  <div class="table-wrap fin-tablewrap"><table class="fin-table"><thead><tr>
    <th>Name</th><th>Amount</th><th data-sort-field="expenseCategory">Category</th><th>Vendor</th>
    <th data-sort-field="paidFrom">Paid From</th><th>Day of Month</th><th>Active</th><th>This Month</th><th>Del</th>
  </tr></thead><tbody>`;
  FIN.recurring.forEach(r => {
    const posted = _recurringPostedThisMonth(r.id);
    html += `<tr class="${r.active ? '' : 'fin-inactive-row'}">
      <td><input type="text" value="${finEsc(r.name)}" onchange="updateRecurring(${r.id},'name',this.value)"></td>
      <td class="money-cell">$<input type="text" inputmode="decimal" value="${r.amount || ''}" onchange="updateRecurring(${r.id},'amount',this.value)"></td>
      <td>${_recSelect(r.id, 'category', ['', ...DROPDOWN_OPTIONS.expenseCategory.filter(Boolean)], r.category)}</td>
      <td><input type="text" value="${finEsc(r.vendor)}" onchange="updateRecurring(${r.id},'vendor',this.value)"></td>
      <td>${_recSelect(r.id, 'paid_from', DROPDOWN_OPTIONS.paidFrom, r.paid_from)}</td>
      <td><input type="text" inputmode="numeric" value="${r.day_of_month || 1}" onchange="updateRecurring(${r.id},'day_of_month',this.value)"></td>
      <td style="text-align:center"><input type="checkbox" ${r.active ? 'checked' : ''} onchange="updateRecurring(${r.id},'active',this.checked)"></td>
      <td>${posted
        ? `<span class="fin-posted">✓ Posted ${posted.date}</span>`
        : (r.active ? `<button class="btn btn-sm btn-primary" onclick="postRecurring(${r.id})">Post now</button>` : '<span class="fin-dim">inactive</span>')}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRecurring(${r.id})">X</button></td>
    </tr>`;
  });
  if (!FIN.recurring.length) {
    html += `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-dim)">
      No recurring expenses yet. Add storage rent, software subscriptions, phone/internet — anything that repeats monthly.</td></tr>`;
  }
  html += '</tbody></table></div>';
  document.getElementById('finContent').innerHTML = html;
}

function _recSelect(id, field, options, current) {
  return `<select onchange="updateRecurring(${id},'${field}',this.value)">${options.map(o =>
    `<option value="${finEsc(o)}"${o === (current || '') ? ' selected' : ''}>${finEsc(o)}</option>`).join('')}</select>`;
}

function updateRecurring(id, field, value) {
  const r = FIN.recurring.find(x => x.id === id);
  if (!r) return;
  if (field === 'amount') value = Number(value) || 0;
  if (field === 'day_of_month') value = Math.min(31, Math.max(1, Number(value) || 1));
  if (field === 'active') value = !!value;
  r[field] = value;
  const timerKey = `rec_${id}_${field}`;
  clearTimeout(_updateTimers[timerKey]);
  _updateTimers[timerKey] = setTimeout(async () => {
    try {
      await supabase.update('recurring_expenses', `id=eq.${id}`, { [field]: value });
    } catch (err) {
      console.error(`updateRecurring(${id}, ${field}) error:`, err);
      toast('Error saving — check console');
    }
  }, 300);
  if (field === 'active' || field === 'day_of_month') renderFinRecurring();
}

async function deleteRecurring(id) {
  const r = FIN.recurring.find(x => x.id === id);
  if (!r) return;
  if (!confirm(`Delete recurring template "${r.name || 'unnamed'}"? Already-posted expenses stay in the log.`)) return;
  try {
    await supabase.delete('recurring_expenses', `id=eq.${id}`);
    FIN.recurring = FIN.recurring.filter(x => x.id !== id);
    renderFinRecurring();
    toast('Recurring expense deleted');
  } catch (err) {
    console.error('deleteRecurring error:', err);
    toast('Error deleting — check console');
  }
}

async function postRecurring(id, opts = {}) {
  const r = FIN.recurring.find(x => x.id === id);
  if (!r) return;
  if (_recurringPostedThisMonth(id)) { toast('Already posted this month'); return; }
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = Math.min(r.day_of_month || 1, lastDay);
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const row = {
    date,
    amount: Number(r.amount) || 0,
    category: r.category || '',
    vendor: r.vendor || '',
    description: r.name || '',
    paid_from: r.paid_from || '',
    reimbursement_status: _isPersonal(r.paid_from) ? 'Owed' : 'N/A',
    in_pl: !_isInventoryCat(r.category),
    source: 'recurring',
    recurring_id: r.id
  };
  try {
    const inserted = await supabase.insert('expenses', row);
    const saved = Array.isArray(inserted) ? inserted[0] : inserted;
    if (saved && saved.id) FIN.expenses.unshift(saved);
    if (!opts.silent) { renderFinRecurring(); toast(`Posted ${r.name || 'expense'} — ${fmt(row.amount)}`); }
    updateReimbBadge();
    return true;
  } catch (err) {
    console.error('postRecurring error:', err);
    toast('Error posting — check console');
    return false;
  }
}

async function postAllDueRecurring() {
  const due = FIN.recurring.filter(r => r.active && !_recurringPostedThisMonth(r.id));
  if (!due.length) { toast('Nothing due — all posted for this month'); return; }
  let posted = 0;
  for (const r of due) {
    if (await postRecurring(r.id, { silent: true })) posted++;
  }
  renderFinRecurring();
  toast(`Posted ${posted} recurring expense${posted === 1 ? '' : 's'}`);
}

// ===== ADD RECURRING MODAL =====
function showRecurringModal() {
  document.getElementById('recName').value = '';
  document.getElementById('recAmount').value = '';
  document.getElementById('recVendor').value = '';
  document.getElementById('recDay').value = '1';
  populateModalSelect('recCategory', DROPDOWN_OPTIONS.expenseCategory, 'Software & Subscriptions');
  populateModalSelect('recPaidFrom', DROPDOWN_OPTIONS.paidFrom, 'Business Credit Card');
  document.getElementById('recurringModal').classList.add('show');
}

function closeRecurringModal() { document.getElementById('recurringModal').classList.remove('show'); }

async function saveRecurring() {
  const name = document.getElementById('recName').value.trim();
  const amount = Number(document.getElementById('recAmount').value) || 0;
  if (!name) { alert('Name is required.'); return; }
  const row = {
    name,
    amount,
    category: document.getElementById('recCategory').value,
    vendor: document.getElementById('recVendor').value.trim(),
    paid_from: document.getElementById('recPaidFrom').value,
    day_of_month: Math.min(31, Math.max(1, Number(document.getElementById('recDay').value) || 1)),
    active: true
  };
  try {
    const inserted = await supabase.insert('recurring_expenses', row);
    const saved = Array.isArray(inserted) ? inserted[0] : inserted;
    if (saved && saved.id) FIN.recurring.push(saved);
    closeRecurringModal();
    renderFinRecurring();
    toast(`Recurring expense added — ${name}`);
  } catch (err) {
    console.error('saveRecurring error:', err);
    toast('Error saving — check console');
  }
}

// ===== MILEAGE =====
function renderFinMileage() {
  const y = String(_finYear);
  const rows = FIN.mileage.filter(m => (m.date || '').startsWith(y));
  const totalMiles = rows.reduce((s, m) => s + (Number(m.miles) || 0), 0);
  let html = `<div class="dashboard">
    <div class="stat-card"><div class="label">Miles Logged (${_finYear})</div><div class="value">${totalMiles.toFixed(1)}</div><div class="sub">${rows.length} trip${rows.length === 1 ? '' : 's'}</div></div>
    <div class="stat-card"><div class="label">Deduction Estimate</div><div class="value positive">${fmt(totalMiles * FIN.mileageRate)}</div><div class="sub">At $${FIN.mileageRate.toFixed(2)}/mile</div></div>
    <div class="stat-card"><div class="label">IRS Rate ($/mile)</div>
      <div class="value fin-rate-wrap">$<input type="text" inputmode="decimal" id="mileageRateInput" value="${FIN.mileageRate.toFixed(2)}" onchange="saveMileageRate(this.value)"></div>
      <div class="sub">2025 rate was $0.70 — confirm the current-year rate with the CPA</div></div>
  </div>
  <div class="toolbar">
    <input type="date" id="milDate" value="${_finToday()}">
    <input type="text" id="milPurpose" placeholder="Purpose (post office run, lot pickup...)" style="min-width:280px">
    <input type="text" id="milMiles" inputmode="decimal" placeholder="Miles" style="width:90px">
    <button class="btn btn-primary" onclick="addMileage()">+ Add Trip</button>
  </div>
  <div class="table-wrap fin-tablewrap"><table class="fin-table"><thead><tr>
    <th>Date</th><th>Purpose</th><th>Miles</th><th>Deduction</th><th>Notes</th><th>Del</th>
  </tr></thead><tbody>`;
  rows.forEach(m => {
    html += `<tr>
      <td><input type="date" value="${finEsc(m.date || '')}" onchange="updateMileage(${m.id},'date',this.value)"></td>
      <td><input type="text" value="${finEsc(m.purpose)}" onchange="updateMileage(${m.id},'purpose',this.value)"></td>
      <td><input type="text" inputmode="decimal" value="${m.miles || ''}" onchange="updateMileage(${m.id},'miles',this.value)"></td>
      <td class="fin-dim">${fmt((Number(m.miles) || 0) * FIN.mileageRate)}</td>
      <td><input type="text" value="${finEsc(m.notes)}" onchange="updateMileage(${m.id},'notes',this.value)"></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteMileage(${m.id})">X</button></td>
    </tr>`;
  });
  if (!rows.length) {
    html += `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-dim)">
      No trips logged for ${_finYear}. Post office runs, supply runs, and lot pickups all count — log them or lose the deduction.</td></tr>`;
  }
  html += '</tbody></table></div>';
  document.getElementById('finContent').innerHTML = html;
}

async function addMileage() {
  const date = document.getElementById('milDate').value;
  const purpose = document.getElementById('milPurpose').value.trim();
  const miles = Number(document.getElementById('milMiles').value) || 0;
  if (!date || !miles) { alert('Date and miles are required.'); return; }
  try {
    const inserted = await supabase.insert('mileage_log', { date, purpose, miles });
    const saved = Array.isArray(inserted) ? inserted[0] : inserted;
    if (saved && saved.id) FIN.mileage.unshift(saved);
    renderFinMileage();
    toast(`Trip logged — ${miles} mi`);
  } catch (err) {
    console.error('addMileage error:', err);
    toast('Error logging trip — check console');
  }
}

function updateMileage(id, field, value) {
  const m = FIN.mileage.find(x => x.id === id);
  if (!m) return;
  if (field === 'miles') value = Number(value) || 0;
  if (field === 'date' && !value) { renderFinMileage(); return; }
  m[field] = value;
  const timerKey = `mil_${id}_${field}`;
  clearTimeout(_updateTimers[timerKey]);
  _updateTimers[timerKey] = setTimeout(async () => {
    try {
      await supabase.update('mileage_log', `id=eq.${id}`, { [field]: value });
    } catch (err) {
      console.error(`updateMileage(${id}, ${field}) error:`, err);
      toast('Error saving — check console');
    }
  }, 300);
}

async function deleteMileage(id) {
  if (!confirm('Delete this trip? This cannot be undone.')) return;
  try {
    await supabase.delete('mileage_log', `id=eq.${id}`);
    FIN.mileage = FIN.mileage.filter(x => x.id !== id);
    renderFinMileage();
    toast('Trip deleted');
  } catch (err) {
    console.error('deleteMileage error:', err);
    toast('Error deleting — check console');
  }
}

async function saveMileageRate(value) {
  const rate = parseFloat(value);
  if (!isFinite(rate) || rate <= 0 || rate > 5) { toast('Enter a valid rate, e.g. 0.70'); renderFinMileage(); return; }
  FIN.mileageRate = rate;
  try {
    const rows = await supabase.select('app_config', 'key=eq.mileage_rate');
    if (rows.length) {
      await supabase.update('app_config', 'key=eq.mileage_rate', { value: String(rate) });
    } else {
      await supabase.insert('app_config', { key: 'mileage_rate', value: String(rate) });
    }
    toast(`Mileage rate set to $${rate.toFixed(2)}/mi`);
  } catch (err) {
    console.error('saveMileageRate error:', err);
    toast('Error saving rate — check console');
  }
  renderFinMileage();
}

// ===== REIMBURSEMENTS =====
// Tracks money John fronted from personal accounts (pre-Feb-2026 Venture X
// charges, personal-savings lot payments, etc.) until the LLC pays it back.
function renderFinReimb() {
  const rows = FIN.expenses.filter(e => e.reimbursement_status !== 'N/A')
    .sort((a, b) => (a.reimbursement_status === 'Owed' ? 0 : 1) - (b.reimbursement_status === 'Owed' ? 0 : 1)
      || (b.date || '').localeCompare(a.date || ''));
  const owed = rows.filter(e => e.reimbursement_status === 'Owed');
  const owedTotal = owed.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const reimbTotal = rows.filter(e => e.reimbursement_status === 'Reimbursed')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  let html = `<div class="dashboard">
    <div class="stat-card"><div class="label">Owed to You</div><div class="value ${owedTotal > 0 ? 'negative' : ''}">${fmt(owedTotal)}</div><div class="sub">${owed.length} expense${owed.length === 1 ? '' : 's'} awaiting reimbursement</div></div>
    <div class="stat-card"><div class="label">Reimbursed to Date</div><div class="value">${fmt(reimbTotal)}</div><div class="sub">All years</div></div>
  </div>
  <div class="table-wrap fin-tablewrap"><table class="fin-table"><thead><tr>
    <th>Date</th><th>Amount</th><th>Category</th><th>Vendor</th><th>Description</th>
    <th>Paid From</th><th>Status</th><th>Reimbursed On</th><th>Action</th>
  </tr></thead><tbody>`;
  rows.forEach(e => {
    const isOwed = e.reimbursement_status === 'Owed';
    html += `<tr>
      <td>${finEsc(e.date || '')}</td>
      <td class="money-cell">${fmt(e.amount)}</td>
      <td>${finEsc(e.category)}</td>
      <td>${finEsc(e.vendor)}</td>
      <td>${finEsc(e.description)}</td>
      <td>${finEsc(e.paid_from)}</td>
      <td><span class="fin-reimb-status ${isOwed ? 'is-owed' : 'is-done'}">${finEsc(e.reimbursement_status)}</span></td>
      <td>${finEsc(e.reimbursed_date || '—')}</td>
      <td>${isOwed
        ? `<button class="btn btn-sm btn-primary" onclick="markReimbursed(${e.id})">Mark reimbursed</button>`
        : `<button class="btn btn-sm" onclick="unmarkReimbursed(${e.id})">Undo</button>`}</td>
    </tr>`;
  });
  if (!rows.length) {
    html += `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-dim)">
      Nothing tracked yet. Add expenses with "Paid From" set to a Personal account (they auto-mark as Owed) —
      including the early Venture X charges and the lots paid from personal savings.</td></tr>`;
  }
  html += `</tbody></table></div>
  <p class="fin-note">Shows all years, not just ${_finYear}. When the LLC pays you back, send one transfer per expense
    (or one batch with a note listing what it covers) from a business account, then click "Mark reimbursed" —
    that keeps the paper trail clean for liability protection. Lot purchases fronted personally should be logged
    with category "Inventory / Lot Purchase" so they appear here without double-counting the P&amp;L.</p>`;
  document.getElementById('finContent').innerHTML = html;
}

async function markReimbursed(id) { await _setReimb(id, 'Reimbursed', _finToday()); }
async function unmarkReimbursed(id) { await _setReimb(id, 'Owed', null); }

async function _setReimb(id, status, date) {
  const e = FIN.expenses.find(x => x.id === id);
  if (!e) return;
  const prev = { s: e.reimbursement_status, d: e.reimbursed_date };
  e.reimbursement_status = status;
  e.reimbursed_date = date;
  try {
    await supabase.update('expenses', `id=eq.${id}`, { reimbursement_status: status, reimbursed_date: date });
    toast(status === 'Reimbursed' ? 'Marked reimbursed' : 'Moved back to Owed');
  } catch (err) {
    e.reimbursement_status = prev.s;
    e.reimbursed_date = prev.d;
    console.error('_setReimb error:', err);
    toast('Error saving — check console');
  }
  renderFinReimb();
  updateReimbBadge();
}
