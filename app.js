// ===== DATA STORE =====
let DATA = { lots: [], items: [], nextSKU: 1 };

// ===== FIELD MAPPING: DB (snake_case) ↔ JS (camelCase) =====
const ITEM_DB_TO_JS = {
  sku: 'sku', lot_id: 'lotId', bstock_item_code: 'bstockItemCode',
  category: 'category', brand: 'brand', model: 'model',
  msrp: 'msrp', powers_on: 'powersOn', core_function: 'coreFunction',
  accessories: 'accessories', missing_items: 'missingItems',
  cosmetic_grade: 'cosmeticGrade', functional_grade: 'functionalGrade',
  tier: 'tier', listed_condition: 'listedCondition', listing_status: 'listingStatus',
  // Legacy single/dual channel columns (read for backward compat, no longer written)
  listing_channel: 'listingChannel', list_price: 'listPrice', date_listed: 'dateListed',
  listing_channel_2: 'listingChannel2', list_price_2: 'listPrice2', date_listed_2: 'dateListed2',
  // New flexible listings array (JSONB)
  listings: 'listings',
  sale_price: 'salePrice', sold_platform: 'soldPlatform', date_sold: 'dateSold', payment_method: 'paymentMethod',
  platform_fees: 'platformFees', shipping_cost: 'shippingCost',
  other_costs: 'otherCosts', notes: 'notes'
};
const ITEM_JS_TO_DB = Object.fromEntries(Object.entries(ITEM_DB_TO_JS).map(([k,v]) => [v,k]));

const LOT_DB_TO_JS = {
  id: 'id', date: 'date', auction_price: 'auctionPrice', shipping_fees: 'shippingFees',
  other_costs: 'otherCosts', total_cost: 'totalCost', total_units: 'totalUnits',
  cost_per_unit: 'costPerUnit', notes: 'notes'
};
const LOT_JS_TO_DB = Object.fromEntries(Object.entries(LOT_DB_TO_JS).map(([k,v]) => [v,k]));

function dbToJs(row, map) {
  const obj = {};
  for (const [dbKey, jsKey] of Object.entries(map)) {
    if (row[dbKey] !== undefined) obj[jsKey] = row[dbKey];
  }
  return obj;
}

function jsToDb(obj, map) {
  const row = {};
  for (const [jsKey, dbKey] of Object.entries(map)) {
    if (obj[jsKey] !== undefined) row[dbKey] = obj[jsKey];
  }
  return row;
}

// ===== LOAD DATA FROM SUPABASE =====
async function loadData() {
  try {
    const [lots, items, configRows] = await Promise.all([
      supabase.select('lots', 'order=id.asc'),
      supabase.select('items', 'order=sku.asc'),
      supabase.select('app_config', 'key=eq.next_sku')
    ]);
    DATA.lots = lots.map(r => dbToJs(r, LOT_DB_TO_JS));
    DATA.items = items.map(r => dbToJs(r, ITEM_DB_TO_JS));
    DATA.nextSKU = configRows.length ? parseInt(configRows[0].value) : 1;
    // Construct listings array and recalculate computed fields
    DATA.items.forEach(i => {
      buildListings(i);
      calcItem(i);
    });
    _snapshotAll();
  } catch (err) {
    console.error('Failed to load data from Supabase:', err);
    toast('Error loading data — check console');
  }
}

// ===== HELPERS =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function fmt(n) {
  if (n == null || isNaN(n)) return '-';
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtPct(n) {
  if (n == null || isNaN(n)) return '-';
  return (Number(n) * 100).toFixed(1) + '%';
}

function calcTier(cosmetic, functional, powersOn, coreFunction) {
  if (powersOn === 'No' || coreFunction === 'No' || functional === 'C' || cosmetic === 'C') return 'Tier 3';
  if (cosmetic === 'B' || functional === 'B') return 'Tier 2';
  return 'Tier 1';
}

function calcItem(item) {
  const lot = DATA.lots.find(l => l.id == item.lotId);
  item.unitCost = lot ? lot.costPerUnit : 0;
  if (item.tier === undefined) item.tier = '';
  const sale = Number(item.salePrice) || 0;
  const fees = Number(item.platformFees) || 0;
  const ship = Number(item.shippingCost) || 0;
  const other = Number(item.otherCosts) || 0;
  if (sale > 0) {
    item.netProceeds = sale - fees - ship - other;
    item.grossProfit = item.netProceeds - item.unitCost;
    item.roi = item.unitCost > 0 ? item.grossProfit / item.unitCost : 0;
  } else {
    item.netProceeds = null;
    item.grossProfit = null;
    item.roi = null;
  }
  return item;
}

function statusLabel(s) {
  // Statuses are now plain strings — pass through unless empty.
  return s || 'Unknown';
}

// ===== LISTINGS ARRAY MANAGEMENT =====
// Build item.listings from the JSONB column, or fall back to legacy columns
function buildListings(item) {
  if (Array.isArray(item.listings) && item.listings.length > 0) {
    // Already have listings from the new JSONB column — normalise values
    item.listings = item.listings.map(l => ({
      channel: l.channel || '',
      price: Number(l.price) || 0,
      dateListed: l.dateListed || ''
    }));
  } else {
    // Backward compat: construct from legacy columns
    item.listings = [];
    if (item.listingChannel || (Number(item.listPrice) > 0) || item.dateListed) {
      item.listings.push({ channel: item.listingChannel || '', price: Number(item.listPrice) || 0, dateListed: item.dateListed || '' });
    }
    if (item.listingChannel2 || (Number(item.listPrice2) > 0) || item.dateListed2) {
      item.listings.push({ channel: item.listingChannel2 || '', price: Number(item.listPrice2) || 0, dateListed: item.dateListed2 || '' });
    }
  }
  // Ensure at least one empty row for rendering
  if (!item.listings.length) {
    item.listings = [{ channel: '', price: 0, dateListed: '' }];
  }
  // Set virtual fields for sorting compatibility
  _syncVirtualFields(item);
}

// Keep virtual fields in sync so sorting by Channel / List $ / Listed still works
function _syncVirtualFields(item) {
  const first = item.listings[0] || {};
  item.listingChannel = first.channel || '';
  item.listPrice = first.price || 0;
  item.dateListed = first.dateListed || '';
}

function addListing(sku) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item) return;
  item.listings.push({ channel: '', price: 0, dateListed: '' });
  _syncVirtualFields(item);
  saveListings(sku);
  renderCurrentView();
}

function removeListing(sku, index) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item || item.listings.length <= 1 || index === 0) return;
  item.listings.splice(index, 1);
  _syncVirtualFields(item);
  saveListings(sku);
  renderCurrentView();
}

function updateListing(sku, index, field, value) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item || !item.listings[index]) return;
  if (field === 'price') value = Number(value) || 0;
  item.listings[index][field] = value;
  _syncVirtualFields(item);
  saveListings(sku);
  // Auto-default soldPlatform when only one channel is listed
  if (field === 'channel') autoDefaultSoldPlatform(sku);
}

function saveListings(sku) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item) return;
  const timerKey = `${sku}_listings`;
  clearTimeout(_updateTimers[timerKey]);
  _updateTimers[timerKey] = setTimeout(async () => {
    const oldListings = _snapshotListings[sku] || [];
    try {
      await supabase.update('items', `sku=eq.${sku}`, { listings: item.listings });
      await logPriceChanges(sku, oldListings, item.listings);
      _snapshotItem(item);
    } catch (err) {
      console.error(`saveListings(${sku}) error:`, err);
      toast('Error saving listings — check console');
    }
  }, 300);
}

// Auto-fill soldPlatform when there's exactly one channel listed
function autoDefaultSoldPlatform(sku) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item || item.soldPlatform) return;
  const channels = item.listings.map(l => l.channel).filter(Boolean);
  if (channels.length !== 1) return;
  item.soldPlatform = channels[0];
  const row = document.querySelector(`tr[data-sku="${sku}"]`);
  if (row) {
    const sp = row.querySelector('select[onchange*="soldPlatform"]');
    if (sp) sp.value = channels[0];
  }
  const timer = `${sku}_soldPlatform`;
  clearTimeout(_updateTimers[timer]);
  _updateTimers[timer] = setTimeout(async () => {
    try { await supabase.update('items', `sku=eq.${sku}`, { sold_platform: channels[0] }); }
    catch (e) { console.error('Auto-set soldPlatform error:', e); }
  }, 300);
}

// Auto-fill salePrice from the matching channel's listing when an item is marked Sold.
// Only fires when salePrice isn't already set, so manual entries are never overwritten.
function autoDefaultSalePrice(sku) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item || Number(item.salePrice) > 0) return;
  let price = 0;
  if (item.soldPlatform) {
    const match = (item.listings || []).find(l => l.channel === item.soldPlatform && Number(l.price) > 0);
    if (match) price = Number(match.price);
  }
  if (!price) {
    const priced = (item.listings || []).filter(l => Number(l.price) > 0);
    if (priced.length === 1) price = Number(priced[0].price);
  }
  if (!price) return;
  item.salePrice = price;
  calcItem(item);
  const row = document.querySelector(`tr[data-sku="${sku}"]`);
  if (row) {
    const sp = row.querySelector('input[onchange*="salePrice"]');
    if (sp) sp.value = price;
  }
  _updateCalcCells(sku, item);
  const timer = `${sku}_salePrice`;
  clearTimeout(_updateTimers[timer]);
  _updateTimers[timer] = setTimeout(async () => {
    try { await supabase.update('items', `sku=eq.${sku}`, { sale_price: item.salePrice }); }
    catch (e) { console.error('Auto-set salePrice error:', e); }
  }, 300);
}

// Update the Net Proceeds / Gross Profit / ROI display cells for a row.
function _updateCalcCells(sku, item) {
  const row = document.querySelector(`tr[data-sku="${sku}"]`);
  if (!row) return;
  row.querySelectorAll('.calc-cell').forEach(c => {
    if (c.dataset.field === 'unitCost') c.textContent = fmt(item.unitCost);
    if (c.dataset.field === 'netProceeds') c.textContent = fmt(item.netProceeds);
    if (c.dataset.field === 'grossProfit') {
      c.textContent = fmt(item.grossProfit);
      c.className = 'calc-cell ' + (item.grossProfit == null ? '' : (item.grossProfit >= 0 ? 'positive' : 'negative'));
    }
    if (c.dataset.field === 'roi') {
      c.textContent = fmtPct(item.roi);
      c.className = 'calc-cell ' + (item.roi == null ? '' : (item.roi >= 0 ? 'positive' : 'negative'));
    }
  });
}

// ===== HISTORY LOGGING (price + status) =====
// Snapshots of last-saved values used to diff for history rows.
const _snapshotListings = {}; // sku -> [{channel, price, dateListed}]
const _snapshotStatus = {};   // sku -> 'Listed' etc.

function _snapshotItem(item) {
  _snapshotListings[item.sku] = (item.listings || []).map(l => ({
    channel: l.channel || '',
    price: Number(l.price) || 0,
    dateListed: l.dateListed || ''
  }));
  _snapshotStatus[item.sku] = item.listingStatus;
}

function _snapshotAll() {
  DATA.items.forEach(_snapshotItem);
}

// Diff old vs new listings by index. Insert one price_history row per channel
// whose price changed to a non-zero value.
async function logPriceChanges(sku, oldListings, newListings) {
  const rows = [];
  newListings.forEach((nl, idx) => {
    const ol = oldListings[idx];
    const oldPrice = ol ? Number(ol.price) || 0 : 0;
    const newPrice = Number(nl.price) || 0;
    if (newPrice > 0 && newPrice !== oldPrice) {
      rows.push({
        item_sku: sku,
        channel: nl.channel || '',
        price: newPrice,
        source: 'manual'
      });
    }
  });
  if (!rows.length) return;
  try { await supabase.insert('price_history', rows); }
  catch (e) { console.error('price_history insert failed:', e); }
}

async function logStatusChange(sku, oldStatus, newStatus) {
  if (oldStatus === newStatus || !newStatus) return;
  try {
    await supabase.insert('status_history', [{
      item_sku: sku,
      status: newStatus,
      source: 'manual'
    }]);
  } catch (e) { console.error('status_history insert failed:', e); }
}

// ===== HISTORY POPOVER =====
let _historyPopover = null;

function _ensureHistoryPopover() {
  if (_historyPopover) return _historyPopover;
  const el = document.createElement('div');
  el.className = 'history-popover';
  el.style.display = 'none';
  document.body.appendChild(el);
  _historyPopover = el;
  document.addEventListener('mousedown', (e) => {
    if (!_historyPopover || _historyPopover.style.display === 'none') return;
    if (e.target.closest('.history-icon')) return;
    if (!_historyPopover.contains(e.target)) hideHistoryPopover();
  });
  return el;
}

function hideHistoryPopover() {
  if (_historyPopover) _historyPopover.style.display = 'none';
}

function _formatHistoryWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function _showHistoryPopover(title, entries, anchor) {
  const el = _ensureHistoryPopover();
  let html = `<div class="history-popover-title">${title}</div>`;
  if (!entries.length) {
    html += '<div class="history-popover-empty">No history yet</div>';
  } else {
    html += '<div class="history-popover-list">';
    entries.forEach(e => {
      const seedTag = e.source === 'seed' ? '<span class="history-popover-seed" title="Initial seed entry — true historical date is unknown">seed</span>' : '';
      html += `<div class="history-popover-entry"><span class="history-popover-when">${_formatHistoryWhen(e.when)}</span><span class="history-popover-value">${e.label}</span>${seedTag}</div>`;
    });
    html += '</div>';
  }
  el.innerHTML = html;
  el.style.display = 'block';
  // Position below the anchor; flip above if it would overflow viewport.
  const rect = anchor.getBoundingClientRect();
  const popH = el.offsetHeight;
  const popW = el.offsetWidth;
  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;
  if (left + popW > window.scrollX + window.innerWidth - 8) {
    left = window.scrollX + window.innerWidth - popW - 8;
  }
  if (rect.bottom + popH > window.innerHeight - 8) {
    top = rect.top + window.scrollY - popH - 4;
  }
  el.style.top = top + 'px';
  el.style.left = Math.max(8, left) + 'px';
}

async function showPriceHistory(sku, channel, anchor) {
  try {
    const data = await supabase.select('price_history',
      `item_sku=eq.${sku}&channel=eq.${encodeURIComponent(channel)}&order=changed_at.desc&limit=20`);
    _showHistoryPopover(
      `${channel || '(no channel)'} — Price History`,
      data.map(r => ({ when: r.changed_at, label: '$' + Number(r.price).toFixed(2), source: r.source })),
      anchor
    );
  } catch (e) {
    console.error('showPriceHistory failed:', e);
    toast('Error loading price history');
  }
}

async function showStatusHistory(sku, anchor) {
  try {
    const data = await supabase.select('status_history',
      `item_sku=eq.${sku}&order=changed_at.desc&limit=20`);
    _showHistoryPopover(
      'Status History',
      data.map(r => ({ when: r.changed_at, label: r.status, source: r.source })),
      anchor
    );
  } catch (e) {
    console.error('showStatusHistory failed:', e);
    toast('Error loading status history');
  }
}

// ===== LISTING AGE HELPERS =====
// Returns the number of days since the oldest active listing date.
function getListingAgeDays(item) {
  const dates = (item.listings || []).map(l => l.dateListed).filter(Boolean);
  if (!dates.length) return null;
  const today = new Date();
  const oldest = dates.sort()[0];
  return Math.floor((today - new Date(oldest + 'T00:00:00')) / 86400000);
}

// Status helpers. Pending and Drafted are NOT "listed" — they pause the repricing clock.
const LISTED_STATUS = 'Listed';
const SOLD_STATUS = 'Sold';
function isListed(item)  { return item.listingStatus === LISTED_STATUS; }
function isSold(item)    { return item.listingStatus === SOLD_STATUS; }
function isOpen(item)    { return item.listingStatus !== SOLD_STATUS; }

// Returns 'danger' (30+), 'warning' (15-29), or '' based on listing age.
function getAgingClass(item) {
  if (!isListed(item)) return '';
  const days = getListingAgeDays(item);
  if (days == null) return '';
  if (days >= 30) return 'age-danger';
  if (days >= 15) return 'age-warning';
  return '';
}

// ===== CUSTOMIZABLE DROPDOWN OPTIONS =====
// Central store for all dropdown options — editable via right-click on column headers
const DROPDOWN_OPTIONS = {
  category:        ['Electronics','Home & Kitchen','Tools','Toys','Clothing','Other'],
  powersOn:        ['','Not Tested (Sealed)','Yes','No'],
  coreFunction:    ['','Not Tested (Sealed)','Yes','No'],
  accessories:     ['','Yes','No','Partial'],
  cosmeticGrade:   ['','A','B','C'],
  functionalGrade: ['','A (Sealed)','A','B','C'],
  tier:            ['','Tier 1','Tier 2','Tier 3'],
  listedCondition: ['','OB/LN','New - Open Box','Used - Like New','Used - Good','Used - Fair','Salvage/Parts'],
  listingStatus:   ['Not Listed','Drafted','Listed','Pending','Sold'],
  listingChannel:  ['','FBM','FBA','eBay','Mercari','OfferUp','Facebook','Craigslist','Direct','Other'],
  paymentMethod:   ['','Cash','Venmo','CashApp','Zelle','PayPal','Credit Card','Cash & Venmo','Other']
};

// Which dropdown fields are editable via right-click
const EDITABLE_DROPDOWNS = ['category','powersOn','coreFunction','accessories','cosmeticGrade','functionalGrade','tier','listedCondition','listingStatus','listingChannel','paymentMethod'];

// Friendly labels for the editor modal
const DROPDOWN_LABELS = {
  category: 'Category', powersOn: 'Powers On', coreFunction: 'Core Function',
  accessories: 'Accessories', cosmeticGrade: 'Cosmetic Grade', functionalGrade: 'Functional Grade',
  tier: 'Tier', listedCondition: 'Listed Condition', listingStatus: 'Status',
  listingChannel: 'Listing Channel', paymentMethod: 'Payment Method'
};

// Map header field names to their dropdown key
const HEADER_TO_DROPDOWN = {
  category: 'category', powersOn: 'powersOn', coreFunction: 'coreFunction',
  accessories: 'accessories', cosmeticGrade: 'cosmeticGrade', functionalGrade: 'functionalGrade',
  tier: 'tier', listedCondition: 'listedCondition', listingStatus: 'listingStatus',
  listingChannel: 'listingChannel', paymentMethod: 'paymentMethod'
};

function conditionOptions() { return DROPDOWN_OPTIONS.listedCondition; }
function channelOptions() { return DROPDOWN_OPTIONS.listingChannel; }
function paymentOptions() { return DROPDOWN_OPTIONS.paymentMethod; }

// Load custom dropdown overrides from Supabase
async function loadDropdownOptions() {
  try {
    const rows = await supabase.select('app_config', 'key=eq.dropdown_options');
    if (rows.length && rows[0].value) {
      const saved = JSON.parse(rows[0].value);
      for (const [key, opts] of Object.entries(saved)) {
        if (DROPDOWN_OPTIONS[key]) {
          DROPDOWN_OPTIONS[key] = opts;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load dropdown options:', err);
  }
}

// Save dropdown options to Supabase
async function saveDropdownOptions() {
  try {
    // Save all editable dropdowns
    const toSave = {};
    for (const key of EDITABLE_DROPDOWNS) {
      toSave[key] = DROPDOWN_OPTIONS[key];
    }
    const rows = await supabase.select('app_config', 'key=eq.dropdown_options');
    if (rows.length) {
      await supabase.update('app_config', 'key=eq.dropdown_options', { value: JSON.stringify(toSave) });
    } else {
      await supabase.insert('app_config', { key: 'dropdown_options', value: JSON.stringify(toSave) });
    }
  } catch (err) {
    console.error('Failed to save dropdown options:', err);
    toast('Error saving dropdown options');
  }
}

// ===== TABS =====
document.getElementById('tabs').addEventListener('click', e => {
  if (!e.target.classList.contains('tab')) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById('view-' + e.target.dataset.tab).style.display = '';
  renderCurrentView();
});

function renderCurrentView() {
  const active = document.querySelector('.tab.active').dataset.tab;
  if (active === 'dashboard') renderDashboard();
  else if (active === 'all') renderAll();
  else if (active === 'open') renderOpen();
  else if (active === 'sold') renderSold();
  else if (active === 'lots') renderLots();
}

// ===== LOT MANAGEMENT =====
let editingLotId = null;

function showLotModal(lotId) {
  editingLotId = lotId || null;
  const m = document.getElementById('lotModal');
  document.getElementById('lotModalTitle').textContent = lotId ? 'Edit Lot' : 'Add New Lot';
  if (lotId) {
    const lot = DATA.lots.find(l => l.id == lotId);
    if (lot) {
      document.getElementById('lotId').value = lot.id;
      document.getElementById('lotDate').value = lot.date || '';
      document.getElementById('lotAuction').value = lot.auctionPrice;
      document.getElementById('lotShipping').value = lot.shippingFees;
      document.getElementById('lotOther').value = lot.otherCosts;
      document.getElementById('lotUnits').value = lot.totalUnits;
      document.getElementById('lotNotes').value = lot.notes || '';
      document.getElementById('lotId').disabled = true;
    }
  } else {
    document.getElementById('lotId').value = DATA.lots.length ? Math.max(...DATA.lots.map(l=>l.id)) + 1 : 1;
    document.getElementById('lotDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('lotAuction').value = '';
    document.getElementById('lotShipping').value = '0';
    document.getElementById('lotOther').value = '0';
    document.getElementById('lotUnits').value = '';
    document.getElementById('lotNotes').value = '';
    document.getElementById('lotId').disabled = false;
  }
  m.classList.add('show');
}

function closeLotModal() { document.getElementById('lotModal').classList.remove('show'); editingLotId = null; }

async function saveLot() {
  const id = Number(document.getElementById('lotId').value);
  const auction = Number(document.getElementById('lotAuction').value) || 0;
  const shipping = Number(document.getElementById('lotShipping').value) || 0;
  const other = Number(document.getElementById('lotOther').value) || 0;
  const units = Number(document.getElementById('lotUnits').value) || 1;
  const dateVal = document.getElementById('lotDate').value || null;
  const notesVal = document.getElementById('lotNotes').value;

  const dbRow = {
    id,
    date: dateVal,
    auction_price: auction,
    shipping_fees: shipping,
    other_costs: other,
    total_units: units,
    notes: notesVal
  };

  try {
    if (editingLotId) {
      // UPDATE existing lot
      const { id: _, ...updateData } = dbRow;
      await supabase.update('lots', `id=eq.${editingLotId}`, updateData);
    } else {
      if (DATA.lots.find(l => l.id == id)) { alert('Lot ID already exists.'); return; }
      await supabase.insert('lots', dbRow);
    }
    // Reload data to pick up computed columns (total_cost, cost_per_unit)
    await loadData();
    closeLotModal();
    updateLotFilters();
    renderCurrentView();
    toast(editingLotId ? 'Lot updated!' : 'Lot added!');
  } catch (err) {
    console.error('saveLot error:', err);
    toast('Error saving lot — check console');
  }
}

// ===== ITEM MANAGEMENT =====
function populateModalSelect(id, options, defaultVal) {
  const sel = document.getElementById(id);
  const filteredOpts = options.filter(o => o !== ''); // skip blank for modal
  sel.innerHTML = filteredOpts.map(o => `<option${o===defaultVal?' selected':''}>${o}</option>`).join('');
  if (defaultVal && filteredOpts.includes(defaultVal)) sel.value = defaultVal;
}

function showItemModal() {
  if (!DATA.lots.length) { alert('Add a lot first before adding items.'); return; }
  const sel = document.getElementById('itemLot');
  sel.innerHTML = DATA.lots.map(l => `<option value="${l.id}">Lot ${l.id}</option>`).join('');
  ['itemBstockCode','itemBrand','itemModel','itemMissing','itemNotes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('itemMSRP').value = '';
  populateModalSelect('itemCategory', DROPDOWN_OPTIONS.category, DROPDOWN_OPTIONS.category[0]);
  populateModalSelect('itemPowers', DROPDOWN_OPTIONS.powersOn, 'Not Tested (Sealed)');
  populateModalSelect('itemFunction', DROPDOWN_OPTIONS.coreFunction, 'Not Tested (Sealed)');
  populateModalSelect('itemAccessories', DROPDOWN_OPTIONS.accessories, 'Yes');
  populateModalSelect('itemCosmetic', DROPDOWN_OPTIONS.cosmeticGrade, 'A');
  populateModalSelect('itemFunctional', DROPDOWN_OPTIONS.functionalGrade, 'A (Sealed)');
  document.getElementById('itemModal').classList.add('show');
}

function closeItemModal() { document.getElementById('itemModal').classList.remove('show'); }

async function saveItem() {
  try {
    const sku = await supabase.rpc('next_sku');
    const item = {
      sku,
      lotId: Number(document.getElementById('itemLot').value),
      bstockItemCode: document.getElementById('itemBstockCode').value.trim(),
      category: document.getElementById('itemCategory').value,
      brand: document.getElementById('itemBrand').value,
      model: document.getElementById('itemModel').value,
      msrp: Math.round(Number(document.getElementById('itemMSRP').value) || 0),
      powersOn: document.getElementById('itemPowers').value,
      coreFunction: document.getElementById('itemFunction').value,
      accessories: document.getElementById('itemAccessories').value,
      missingItems: document.getElementById('itemMissing').value,
      cosmeticGrade: document.getElementById('itemCosmetic').value,
      functionalGrade: document.getElementById('itemFunctional').value,
      tier: '',
      listedCondition: '',
      listingStatus: 'Not Listed',
      listings: [{ channel: '', price: 0, dateListed: '' }],
      salePrice: 0,
      soldPlatform: '',
      dateSold: null,
      paymentMethod: '',
      platformFees: 0,
      shippingCost: 0,
      otherCosts: 0,
      notes: document.getElementById('itemNotes').value,
    };

    const dbRow = jsToDb(item, ITEM_JS_TO_DB);
    await supabase.insert('items', dbRow);

    // Add to local state
    buildListings(item);
    calcItem(item);
    DATA.items.push(item);
    DATA.nextSKU = sku + 1;
    _snapshotItem(item);
    // Seed status_history for the new item (single 'Not Listed' entry).
    try {
      await supabase.insert('status_history', [{ item_sku: sku, status: item.listingStatus, source: 'initial' }]);
    } catch (e) { console.error('initial status_history insert failed:', e); }

    closeItemModal();
    renderCurrentView();
    updateBadges();
    toast('Item added (SKU ' + sku + ')');
  } catch (err) {
    console.error('saveItem error:', err);
    toast('Error saving item — check console');
  }
}

async function deleteItem(sku) {
  if (!confirm('Delete SKU ' + sku + '? This cannot be undone.')) return;
  try {
    await supabase.delete('items', `sku=eq.${sku}`);
    DATA.items = DATA.items.filter(i => i.sku !== sku);
    renderCurrentView();
    updateBadges();
    toast('Item deleted');
  } catch (err) {
    console.error('deleteItem error:', err);
    toast('Error deleting item — check console');
  }
}

// Debounce map for field updates
const _updateTimers = {};

function updateField(sku, field, value) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item) return;
  if (['salePrice','platformFees','shippingCost','otherCosts','msrp'].includes(field)) {
    item[field] = Number(value) || 0;
    if (field === 'msrp') item[field] = Math.round(item[field]);
  } else {
    item[field] = value;
  }
  calcItem(item);

  // Auto-default soldPlatform when status changes
  if (field === 'listingStatus') autoDefaultSoldPlatform(sku);
  // Auto-fill salePrice from the matching listing when an item becomes Sold
  if ((field === 'listingStatus' || field === 'soldPlatform') && item.listingStatus === 'Sold') {
    autoDefaultSalePrice(sku);
  }

  // Update the MSRP input to show the rounded value
  if (field === 'msrp') {
    const row0 = document.querySelector(`tr[data-sku="${sku}"]`);
    if (row0) {
      const msrpInput = row0.querySelector('input[onchange*="msrp"]');
      if (msrpInput) msrpInput.value = item.msrp;
    }
  }

  // Update calculated display cells immediately
  _updateCalcCells(sku, item);

  // Debounce the DB write (300ms) so rapid typing doesn't spam requests
  const timerKey = `${sku}_${field}`;
  clearTimeout(_updateTimers[timerKey]);
  _updateTimers[timerKey] = setTimeout(async () => {
    try {
      const dbField = ITEM_JS_TO_DB[field];
      if (!dbField) return;
      let dbValue = item[field];
      // Convert empty date strings to null for date columns
      if (field === 'dateSold' && dbValue === '') dbValue = null;
      const prevStatus = _snapshotStatus[sku];
      await supabase.update('items', `sku=eq.${sku}`, { [dbField]: dbValue });
      if (field === 'listingStatus') {
        await logStatusChange(sku, prevStatus, item.listingStatus);
        _snapshotStatus[sku] = item.listingStatus;
      }
    } catch (err) {
      console.error(`updateField(${sku}, ${field}) error:`, err);
      toast('Error saving change — check console');
    }
  }, 300);
}

// ===== RENDER FUNCTIONS =====
function makeSelect(sku, field, options, current) {
  return `<select onchange="updateField(${sku},'${field}',this.value)">${options.map(o => {
    const val = typeof o === 'object' ? o.value : o;
    const label = typeof o === 'object' ? o.label : o;
    return `<option value="${val}" ${val == current ? 'selected' : ''}>${label}</option>`;
  }).join('')}</select>`;
}

function makeInput(sku, field, value, type='text') {
  const v = value == null || value === undefined ? '' : value;
  if (type === 'number') {
    return `<input type="text" inputmode="decimal" value="${v}" onchange="updateField(${sku},'${field}',this.value)">`;
  }
  return `<input type="${type}" value="${v}" onchange="updateField(${sku},'${field}',this.value)">`;
}

function itemRow(item, showAllCols=true) {
  const statusOpts = DROPDOWN_OPTIONS.listingStatus;
  const ageCls = getAgingClass(item);
  let html = `<tr data-sku="${item.sku}" class="${ageCls}">`;
  html += `<td>${item.sku}</td>`;
  html += `<td>Lot ${item.lotId}</td>`;
  html += `<td>${makeInput(item.sku,'bstockItemCode',item.bstockItemCode || '')}</td>`;
  html += `<td>${makeInput(item.sku,'brand',item.brand)}</td>`;
  html += `<td>${makeInput(item.sku,'model',item.model)}</td>`;
  html += `<td>${makeSelect(item.sku,'category',DROPDOWN_OPTIONS.category,item.category)}</td>`;
  html += `<td class="calc-cell" data-field="unitCost">${fmt(item.unitCost)}</td>`;
  if (showAllCols) {
    html += `<td>${makeSelect(item.sku,'cosmeticGrade',DROPDOWN_OPTIONS.cosmeticGrade,item.cosmeticGrade)}</td>`;
    html += `<td>${makeSelect(item.sku,'functionalGrade',DROPDOWN_OPTIONS.functionalGrade,item.functionalGrade)}</td>`;
  }
  const tierClass = item.tier==='Tier 1'?'tier-select-1':item.tier==='Tier 2'?'tier-select-2':'tier-select-3';
  html += `<td><select class="${tierClass}" onchange="updateField(${item.sku},'tier',this.value);this.className='tier-select-'+(this.value==='Tier 1'?'1':this.value==='Tier 2'?'2':'3')">
    ${DROPDOWN_OPTIONS.tier.map(t => `<option value="${t}" ${t===item.tier?'selected':''}>${t}</option>`).join('')}
  </select></td>`;
  html += `<td>${makeSelect(item.sku,'listedCondition',conditionOptions(),item.listedCondition)}</td>`;
  html += `<td class="cell-with-history">${makeSelect(item.sku,'listingStatus',statusOpts,item.listingStatus)}<button class="history-icon" onclick="showStatusHistory(${item.sku},this)" title="Status history">&#9201;</button></td>`;
  // --- Flexible listings: Channel / List $ / Listed ---
  const ls = item.listings || [{ channel: '', price: 0, dateListed: '' }];
  let chHtml = '<td class="listings-cell">';
  ls.forEach((l, idx) => {
    const rmBtn = idx > 0 ? ` <button class="listing-rm" onclick="removeListing(${item.sku},${idx})" title="Remove">&times;</button>` : '';
    chHtml += `<div class="listing-entry"><select onchange="updateListing(${item.sku},${idx},'channel',this.value)">${channelOptions().map(o => `<option value="${o}" ${o==(l.channel||'')?'selected':''}>${o}</option>`).join('')}</select>${rmBtn}</div>`;
  });
  chHtml += `<button class="listing-add" onclick="addListing(${item.sku})" title="Add channel">+</button></td>`;
  html += chHtml;
  let prHtml = '<td class="listings-cell money-cell">';
  ls.forEach((l, idx) => {
    const chAttr = (l.channel || '').replace(/'/g, "\\'");
    prHtml += `<div class="listing-entry listing-money">$<input type="text" inputmode="decimal" value="${l.price||''}" onchange="updateListing(${item.sku},${idx},'price',this.value)"><button class="history-icon" onclick="showPriceHistory(${item.sku},'${chAttr}',this)" title="Price history">&#9201;</button></div>`;
  });
  prHtml += '</td>';
  html += prHtml;
  let dtHtml = '<td class="listings-cell">';
  ls.forEach((l, idx) => {
    dtHtml += `<div class="listing-entry"><input type="date" value="${l.dateListed||''}" onchange="updateListing(${item.sku},${idx},'dateListed',this.value)"></div>`;
  });
  dtHtml += '</td>';
  html += dtHtml;
  html += `<td class="money-cell">$${makeInput(item.sku,'salePrice',item.salePrice||'','number')}</td>`;
  html += `<td>${makeSelect(item.sku,'soldPlatform',channelOptions(),item.soldPlatform||'')}</td>`;
  html += `<td>${makeInput(item.sku,'dateSold',item.dateSold,'date')}</td>`;
  html += `<td>${makeSelect(item.sku,'paymentMethod',paymentOptions(),item.paymentMethod)}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'platformFees',item.platformFees ?? 0,'number')}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'shippingCost',item.shippingCost ?? 0,'number')}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'otherCosts',item.otherCosts ?? 0,'number')}</td>`;
  html += `<td class="calc-cell" data-field="netProceeds">${fmt(item.netProceeds)}</td>`;
  html += `<td class="calc-cell ${item.grossProfit>=0?'positive':'negative'}" data-field="grossProfit">${fmt(item.grossProfit)}</td>`;
  html += `<td class="calc-cell ${item.roi>=0?'positive':'negative'}" data-field="roi">${fmtPct(item.roi)}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'msrp',item.msrp ? Math.round(item.msrp) : '','number')}</td>`;
  html += `<td>${makeInput(item.sku,'notes',item.notes)}</td>`;
  html += `<td><button class="btn btn-danger btn-sm" onclick="deleteItem(${item.sku})">X</button></td>`;
  html += `</tr>`;
  return html;
}

// ===== STALE LISTINGS FILTER =====
let _staleFilter = 'all'; // 'all', 'warning' (21+), 'danger' (30+)

function setStaleFilter(val) {
  _staleFilter = val;
  document.querySelectorAll('.stale-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.stale === val);
  });
  renderOpen();
}

// Update stale count badges on the filter buttons
function updateStaleBadges() {
  const listed = DATA.items.filter(isListed);
  const warning = listed.filter(i => { const d = getListingAgeDays(i); return d != null && d >= 15; }).length;
  const danger = listed.filter(i => { const d = getListingAgeDays(i); return d != null && d >= 30; }).length;
  document.querySelectorAll('.stale-btn').forEach(b => {
    const badge = b.querySelector('.stale-badge');
    if (badge) badge.remove();
    if (b.dataset.stale === 'warning' && warning > 0) {
      b.innerHTML = `15+ Days<span class="stale-badge">${warning}</span>`;
    } else if (b.dataset.stale === 'danger' && danger > 0) {
      b.innerHTML = `30+ Days<span class="stale-badge">${danger}</span>`;
    }
  });
}

// ===== SORTING STATE =====
let currentSortField = null;
let currentSortDir = 'asc';

const HEADER_FIELD_MAP_ALL = [
  {label:'SKU',field:'sku'},{label:'Lot',field:'lotId'},{label:'BStock #',field:'bstockItemCode'},
  {label:'Brand',field:'brand'},{label:'Model',field:'model'},
  {label:'Category',field:'category'},{label:'Unit Cost',field:'unitCost'},
  {label:'Cosmetic',field:'cosmeticGrade'},{label:'Functional',field:'functionalGrade'},
  {label:'Tier',field:'tier'},{label:'Condition',field:'listedCondition'},{label:'Status',field:'listingStatus'},
  {label:'Channel',field:'listingChannel'},{label:'List $',field:'listPrice'},{label:'Listed',field:'dateListed'},
  {label:'Sale $',field:'salePrice'},{label:'Sold On',field:'soldPlatform'},{label:'Sold',field:'dateSold'},{label:'Payment',field:'paymentMethod'},
  {label:'Fees',field:'platformFees'},{label:'Shipping',field:'shippingCost'},{label:'Other $',field:'otherCosts'},
  {label:'Net',field:'netProceeds'},{label:'Profit',field:'grossProfit'},{label:'ROI%',field:'roi'},
  {label:'MSRP',field:'msrp'},{label:'Notes',field:'notes'}
];
const HEADER_FIELD_MAP_SHORT = HEADER_FIELD_MAP_ALL.filter(h =>
  !['powersOn','coreFunction','accessories','missingItems','cosmeticGrade','functionalGrade'].includes(h.field)
);

// Default column widths (px) by field name
const COL_DEFAULT_WIDTHS = {
  sku: 75, lotId: 80, bstockItemCode: 100, brand: 155, model: 200, category: 140, unitCost: 120,
  powersOn: 120, coreFunction: 140, accessories: 130, missingItems: 155,
  cosmeticGrade: 125, functionalGrade: 140, tier: 95, listedCondition: 140,
  listingStatus: 110, listingChannel: 125, listPrice: 110, dateListed: 135,
  salePrice: 110, soldPlatform: 120, dateSold: 135, paymentMethod: 135, platformFees: 110,
  shippingCost: 125, otherCosts: 110, netProceeds: 120, grossProfit: 120,
  roi: 95, msrp: 110, notes: 220
};

function rth(col) {
  if (!col) return '<th style="width:45px"></th>';
  const arrow = currentSortField === col.field
    ? (currentSortDir === 'asc' ? '\u25B2' : '\u25BC')
    : '\u25B2';
  const sortedClass = currentSortField === col.field ? ' sorted' : '';
  const defaultW = COL_DEFAULT_WIDTHS[col.field] || 100;
  return `<th class="${sortedClass}" style="width:${defaultW}px" data-sort-field="${col.field}" onclick="if(!event.target.classList.contains('col-resize'))toggleSort('${col.field}')">${col.label}<span class="sort-arrow">${arrow}</span><span class="col-resize"></span></th>`;
}

function tableHeaders(showAllCols=true) {
  const cols = showAllCols ? HEADER_FIELD_MAP_ALL : HEADER_FIELD_MAP_SHORT;
  let h = '<tr>' + cols.map(rth).join('');
  h += '<th></th></tr>';
  return h;
}

function toggleSort(field) {
  if (currentSortField === field) {
    currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field;
    currentSortDir = 'asc';
  }
  reRenderCurrentView();
}

function sortItems(items) {
  if (!currentSortField) return items;
  const field = currentSortField;
  const dir = currentSortDir === 'asc' ? 1 : -1;
  return items.sort((a, b) => {
    let va = a[field], vb = b[field];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    va = String(va).toLowerCase();
    vb = String(vb).toLowerCase();
    return va.localeCompare(vb) * dir;
  });
}

function reRenderCurrentView() {
  const active = document.querySelector('.tab.active');
  if (!active) return;
  const tab = active.dataset.tab;
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'all') renderAll();
  else if (tab === 'open') renderOpen();
  else if (tab === 'sold') renderSold();
  else if (tab === 'lots') renderLots();
}

function filterItems(items, search, lotFilter) {
  if (lotFilter) items = items.filter(i => i.lotId == lotFilter);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => (i.brand||'').toLowerCase().includes(s) || (i.model||'').toLowerCase().includes(s) || String(i.sku).includes(s) || (i.bstockItemCode||'').toLowerCase().includes(s));
  }
  return items;
}

// ===== DASHBOARD CHARTS =====
let _chartRange = 'all'; // 30, 60, 90, or 'all'
const _chartInstances = {}; // track Chart.js instances for cleanup

function setChartRange(range) {
  _chartRange = range;
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.range == range);
  });
  renderDashboardCharts();
}

function _destroyChart(id) {
  if (_chartInstances[id]) { _chartInstances[id].destroy(); delete _chartInstances[id]; }
}

function _getRangeLabel() {
  return _chartRange === 'all' ? 'All Time' : `Last ${_chartRange} Days`;
}

function _filterByRange(items, dateField) {
  if (_chartRange === 'all') return items;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(_chartRange));
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return items.filter(i => i[dateField] && i[dateField] >= cutoffStr);
}

// Week start helper — returns 'YYYY-MM-DD' of the Monday of that week
function _weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Short label for a week: 'Jan 6'
function _weekLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Chart.js default overrides for dark theme
const CHART_COLORS = {
  grid: 'rgba(46,51,71,0.6)',
  text: '#8b90a5',
  accent: '#4f8cff',
  green: '#34d399',
  red: '#f87171',
  yellow: '#fbbf24',
  orange: '#fb923c',
  purple: '#a78bfa',
  pink: '#f472b6',
  teal: '#2dd4bf',
  blue: '#60a5fa',
  palette: ['#4f8cff','#34d399','#fbbf24','#fb923c','#a78bfa','#f472b6','#2dd4bf','#60a5fa','#f87171','#818cf8']
};

function _chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: CHART_COLORS.text, font: { size: 11 }, padding: 12, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8 } },
      tooltip: { backgroundColor: '#1a1d27', titleColor: '#e4e7ef', bodyColor: '#e4e7ef', borderColor: '#2e3347', borderWidth: 1, padding: 10, cornerRadius: 6, titleFont: { size: 12 }, bodyFont: { size: 12 } }
    }
  };
}

function _scaleDefaults() {
  return {
    x: { ticks: { color: CHART_COLORS.text, font: { size: 11 } }, grid: { color: CHART_COLORS.grid }, border: { color: CHART_COLORS.grid } },
    y: { ticks: { color: CHART_COLORS.text, font: { size: 11 } }, grid: { color: CHART_COLORS.grid }, border: { color: CHART_COLORS.grid }, beginAtZero: true }
  };
}

// ===== INDIVIDUAL CHART BUILDERS =====

function renderChartCategory() {
  const open = DATA.items.filter(i => i.listingStatus !== 'Sold');
  const counts = {};
  open.forEach(i => { const cat = i.category || 'Other'; counts[cat] = (counts[cat] || 0) + 1; });
  const labels = Object.keys(counts);
  const data = Object.values(counts);

  _destroyChart('chartCategory');
  if (!labels.length) { document.getElementById('chartCategory').parentElement.innerHTML = '<div class="chart-empty">No open inventory</div>'; return; }

  _chartInstances['chartCategory'] = new Chart(document.getElementById('chartCategory'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: CHART_COLORS.palette.slice(0, labels.length), borderColor: '#1a1d27', borderWidth: 2 }] },
    options: { ..._chartDefaults(), cutout: '60%', plugins: { ..._chartDefaults().plugins, legend: { ...(_chartDefaults().plugins.legend), position: 'right' } } }
  });
}

function renderChartCondition() {
  const open = DATA.items.filter(i => i.listingStatus !== 'Sold');
  const counts = {};
  open.forEach(i => { const cond = i.listedCondition || 'Not Set'; counts[cond] = (counts[cond] || 0) + 1; });
  const labels = Object.keys(counts);
  const data = Object.values(counts);

  _destroyChart('chartCondition');
  if (!labels.length) { document.getElementById('chartCondition').parentElement.innerHTML = '<div class="chart-empty">No open inventory</div>'; return; }

  _chartInstances['chartCondition'] = new Chart(document.getElementById('chartCondition'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: CHART_COLORS.palette.slice(0, labels.length), borderColor: '#1a1d27', borderWidth: 2 }] },
    options: { ..._chartDefaults(), cutout: '60%', plugins: { ..._chartDefaults().plugins, legend: { ...(_chartDefaults().plugins.legend), position: 'right' } } }
  });
}

function renderChartAging() {
  const open = DATA.items.filter(i => i.listingStatus !== 'Sold');
  const today = new Date();
  const buckets = { '0–15 days': 0, '15–30 days': 0, '30–45 days': 0, '45–60 days': 0, '60+ days': 0 };

  open.forEach(i => {
    // Use dateListed, or fall back to lot date, or treat as old
    let entryDate = i.dateListed;
    if (!entryDate) {
      const lot = DATA.lots.find(l => l.id == i.lotId);
      entryDate = lot ? lot.date : null;
    }
    if (!entryDate) { buckets['60+ days']++; return; }
    const days = Math.floor((today - new Date(entryDate + 'T00:00:00')) / 86400000);
    if (days < 15) buckets['0–15 days']++;
    else if (days < 30) buckets['15–30 days']++;
    else if (days < 45) buckets['30–45 days']++;
    else if (days < 60) buckets['45–60 days']++;
    else buckets['60+ days']++;
  });

  const labels = Object.keys(buckets);
  const data = Object.values(buckets);
  const colors = [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.yellow, CHART_COLORS.orange, CHART_COLORS.red];

  _destroyChart('chartAging');

  _chartInstances['chartAging'] = new Chart(document.getElementById('chartAging'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, maxBarThickness: 60 }] },
    options: {
      ..._chartDefaults(),
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { ..._chartDefaults().plugins, legend: { display: false },
        tooltip: { ..._chartDefaults().plugins.tooltip, callbacks: { label: ctx => `${ctx.raw} items` } }
      },
      scales: {
        x: { ..._scaleDefaults().x, title: { display: true, text: 'Items', color: CHART_COLORS.text, font: { size: 11 } } },
        y: { ..._scaleDefaults().y, grid: { display: false } }
      }
    }
  });
}

function renderChartSales() {
  const sold = _filterByRange(DATA.items.filter(i => i.listingStatus === 'Sold' && i.dateSold), 'dateSold');
  const rangeLabel = _getRangeLabel();
  const el = document.getElementById('salesRangeLabel');
  if (el) el.textContent = `${rangeLabel} — Weekly`;

  // Group by week
  const weeks = {};
  sold.forEach(i => {
    const wk = _weekStart(i.dateSold);
    if (!weeks[wk]) weeks[wk] = { count: 0, revenue: 0 };
    weeks[wk].count++;
    weeks[wk].revenue += Number(i.salePrice) || 0;
  });

  const sortedWeeks = Object.keys(weeks).sort();
  const labels = sortedWeeks.map(_weekLabel);
  const countData = sortedWeeks.map(w => weeks[w].count);
  const revenueData = sortedWeeks.map(w => weeks[w].revenue);

  _destroyChart('chartSales');
  if (!sortedWeeks.length) { document.getElementById('chartSales').parentElement.innerHTML = '<div class="chart-empty">No sales in this period</div>'; return; }

  _chartInstances['chartSales'] = new Chart(document.getElementById('chartSales'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Sales', data: countData, backgroundColor: CHART_COLORS.accent, borderRadius: 4, maxBarThickness: 40, yAxisID: 'y' },
        { label: 'Revenue', data: revenueData, type: 'line', borderColor: CHART_COLORS.green, backgroundColor: 'rgba(52,211,153,0.1)', pointBackgroundColor: CHART_COLORS.green, pointRadius: 3, tension: 0.3, fill: true, yAxisID: 'y1' }
      ]
    },
    options: {
      ..._chartDefaults(),
      scales: {
        x: { ..._scaleDefaults().x },
        y: { ..._scaleDefaults().y, position: 'left', title: { display: true, text: 'Sales', color: CHART_COLORS.text, font: { size: 11 } },
          ticks: { ..._scaleDefaults().y.ticks, stepSize: 1 } },
        y1: { ..._scaleDefaults().y, position: 'right', grid: { drawOnChartArea: false },
          title: { display: true, text: 'Revenue ($)', color: CHART_COLORS.text, font: { size: 11 } },
          ticks: { ..._scaleDefaults().y.ticks, callback: v => '$' + v } }
      }
    }
  });
}

function renderChartDaysToSell() {
  const sold = _filterByRange(DATA.items.filter(i => i.listingStatus === 'Sold' && i.dateSold && i.dateListed), 'dateSold');
  const rangeLabel = _getRangeLabel();
  const el = document.getElementById('daysRangeLabel');
  if (el) el.textContent = `${rangeLabel} — Weekly`;

  // Calc days-to-sell for each item, group by week sold
  const weeks = {};
  sold.forEach(i => {
    const dListed = new Date(i.dateListed + 'T00:00:00');
    const dSold = new Date(i.dateSold + 'T00:00:00');
    const days = Math.max(0, Math.floor((dSold - dListed) / 86400000));
    const wk = _weekStart(i.dateSold);
    if (!weeks[wk]) weeks[wk] = [];
    weeks[wk].push(days);
  });

  const sortedWeeks = Object.keys(weeks).sort();
  const labels = sortedWeeks.map(_weekLabel);
  const avgData = sortedWeeks.map(w => {
    const arr = weeks[w];
    return Math.round(arr.reduce((s,d) => s + d, 0) / arr.length);
  });

  _destroyChart('chartDaysToSell');
  if (!sortedWeeks.length) { document.getElementById('chartDaysToSell').parentElement.innerHTML = '<div class="chart-empty">No data — need listed + sold dates</div>'; return; }

  _chartInstances['chartDaysToSell'] = new Chart(document.getElementById('chartDaysToSell'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Avg Days to Sell',
        data: avgData,
        borderColor: CHART_COLORS.orange,
        backgroundColor: 'rgba(251,146,60,0.1)',
        pointBackgroundColor: CHART_COLORS.orange,
        pointRadius: 4,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      ..._chartDefaults(),
      plugins: { ..._chartDefaults().plugins, legend: { display: false },
        tooltip: { ..._chartDefaults().plugins.tooltip, callbacks: { label: ctx => `${ctx.raw} days avg` } }
      },
      scales: {
        x: { ..._scaleDefaults().x },
        y: { ..._scaleDefaults().y, title: { display: true, text: 'Days', color: CHART_COLORS.text, font: { size: 11 } } }
      }
    }
  });
}

function renderChartCumulative() {
  const sold = _filterByRange(DATA.items.filter(i => i.listingStatus === 'Sold' && i.dateSold), 'dateSold');
  const rangeLabel = _getRangeLabel();
  const el = document.getElementById('cumulativeRangeLabel');
  if (el) el.textContent = rangeLabel;

  // Sort by date sold
  const sorted = [...sold].sort((a,b) => (a.dateSold||'').localeCompare(b.dateSold||''));

  _destroyChart('chartCumulative');
  if (!sorted.length) { document.getElementById('chartCumulative').parentElement.innerHTML = '<div class="chart-empty">No sales in this period</div>'; return; }

  // Build cumulative data grouped by week
  const weeks = {};
  let cumRevenue = 0, cumProfit = 0;
  sorted.forEach(i => {
    const wk = _weekStart(i.dateSold);
    cumRevenue += Number(i.salePrice) || 0;
    cumProfit += i.grossProfit || 0;
    weeks[wk] = { revenue: cumRevenue, profit: cumProfit };
  });

  const sortedWeeks = Object.keys(weeks).sort();
  const labels = sortedWeeks.map(_weekLabel);
  const revenueData = sortedWeeks.map(w => Math.round(weeks[w].revenue * 100) / 100);
  const profitData = sortedWeeks.map(w => Math.round(weeks[w].profit * 100) / 100);

  _chartInstances['chartCumulative'] = new Chart(document.getElementById('chartCumulative'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Cumulative Revenue', data: revenueData, borderColor: CHART_COLORS.accent, backgroundColor: 'rgba(79,140,255,0.08)', pointBackgroundColor: CHART_COLORS.accent, pointRadius: 3, tension: 0.3, fill: true },
        { label: 'Cumulative Profit', data: profitData, borderColor: CHART_COLORS.green, backgroundColor: 'rgba(52,211,153,0.08)', pointBackgroundColor: CHART_COLORS.green, pointRadius: 3, tension: 0.3, fill: true }
      ]
    },
    options: {
      ..._chartDefaults(),
      plugins: { ..._chartDefaults().plugins,
        tooltip: { ..._chartDefaults().plugins.tooltip, callbacks: { label: ctx => ctx.dataset.label + ': $' + ctx.raw.toLocaleString() } }
      },
      scales: {
        x: { ..._scaleDefaults().x },
        y: { ..._scaleDefaults().y, ticks: { ..._scaleDefaults().y.ticks, callback: v => '$' + v.toLocaleString() } }
      }
    }
  });
}

// ===== RENDER ALL DASHBOARD CHARTS =====
function renderDashboardCharts() {
  if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded yet'); return; }
  renderChartCategory();
  renderChartCondition();
  renderChartAging();
  renderChartSales();
  renderChartDaysToSell();
  renderChartCumulative();
}

function renderDashboard() {
  DATA.items.forEach(i => calcItem(i));
  const total = DATA.items.length;
  const sold = DATA.items.filter(isSold);
  const open = DATA.items.filter(isOpen);
  const listed = DATA.items.filter(isListed);
  const totalRevenue = sold.reduce((s,i) => s + (Number(i.salePrice)||0), 0);
  const totalCost = sold.reduce((s,i) => s + (i.unitCost||0), 0);
  const totalFees = sold.reduce((s,i) => s + (Number(i.platformFees)||0) + (Number(i.shippingCost)||0) + (Number(i.otherCosts)||0), 0);
  const netProfit = sold.reduce((s,i) => s + (i.grossProfit||0), 0);
  const avgRoi = sold.length ? sold.reduce((s,i) => s + (i.roi||0), 0) / sold.length : 0;
  const investedOpen = open.reduce((s,i) => s + (i.unitCost||0), 0);
  const listedValue = listed.reduce((s,i) => s + (Number(i.listPrice)||0), 0);

  document.getElementById('dashboardStats').innerHTML = `
    <div class="stat-card"><div class="label">Total Items</div><div class="value">${total}</div><div class="sub">${sold.length} sold / ${open.length} open</div></div>
    <div class="stat-card"><div class="label">Gross Revenue</div><div class="value">${fmt(totalRevenue)}</div><div class="sub">From ${sold.length} sales</div></div>
    <div class="stat-card"><div class="label">Net Profit</div><div class="value ${netProfit>=0?'positive':'negative'}">${fmt(netProfit)}</div><div class="sub">After ${fmt(totalFees)} in fees</div></div>
    <div class="stat-card"><div class="label">Avg ROI (Sold)</div><div class="value ${avgRoi>=0?'positive':'negative'}">${fmtPct(avgRoi)}</div><div class="sub">Per item average</div></div>
    <div class="stat-card"><div class="label">Open Inventory</div><div class="value">${open.length}</div><div class="sub">${fmt(investedOpen)} invested</div></div>
    <div class="stat-card"><div class="label">Listed Value</div><div class="value">${fmt(listedValue)}</div><div class="sub">${listed.length} items listed</div></div>
    <div class="stat-card"><div class="label">Total Lots</div><div class="value">${DATA.lots.length}</div><div class="sub">${fmt(DATA.lots.reduce((s,l)=>s+l.totalCost,0))} total invested</div></div>
    <div class="stat-card"><div class="label">Total COGS</div><div class="value">${fmt(totalCost)}</div><div class="sub">Cost of sold items</div></div>
  `;

  renderDashboardCharts();
}

function renderAll() {
  DATA.items.forEach(i => calcItem(i));
  const search = document.getElementById('searchAll').value;
  const lot = document.getElementById('filterLot').value;
  const status = document.getElementById('filterStatus').value;
  const tier = document.getElementById('filterTier').value;
  let items = [...DATA.items];
  items = filterItems(items, search, lot);
  if (status) items = items.filter(i => i.listingStatus === status);
  if (tier) items = items.filter(i => i.tier === tier);
  items = sortItems(items);
  let html = '<table>' + tableHeaders(true);
  items.forEach(i => html += itemRow(i, true));
  if (!items.length) html += '<tr><td colspan="30" style="text-align:center;padding:24px;color:var(--text-dim)">No items found</td></tr>';
  html += '</table>';
  document.getElementById('allTable').innerHTML = html;
  applyColumnWidths('allTable');
}

function renderOpen() {
  DATA.items.forEach(i => calcItem(i));
  const search = document.getElementById('searchOpen').value;
  const lot = document.getElementById('filterOpenLot').value;
  let items = DATA.items.filter(i => i.listingStatus !== 'Sold');
  items = filterItems(items, search, lot);

  // Apply stale listing filter
  if (_staleFilter === 'warning') {
    items = items.filter(i => {
      const d = getListingAgeDays(i);
      return isListed(i) && d != null && d >= 15;
    });
  } else if (_staleFilter === 'danger') {
    items = items.filter(i => {
      const d = getListingAgeDays(i);
      return isListed(i) && d != null && d >= 30;
    });
  }

  items = sortItems(items);
  let html = '<table>' + tableHeaders(true);
  items.forEach(i => html += itemRow(i, true));
  if (!items.length) {
    const msg = _staleFilter !== 'all'
      ? 'No stale listings found — looking good!'
      : 'All items sold! Nice work.';
    html += `<tr><td colspan="30" style="text-align:center;padding:24px;color:var(--text-dim)">${msg}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('openTable').innerHTML = html;
  applyColumnWidths('openTable');
  updateStaleBadges();
}

function renderSold() {
  DATA.items.forEach(i => calcItem(i));
  const search = document.getElementById('searchSold').value;
  const lot = document.getElementById('filterSoldLot').value;
  let items = DATA.items.filter(i => i.listingStatus === 'Sold');
  items = filterItems(items, search, lot);
  if (currentSortField) {
    items = sortItems(items);
  } else {
    items.sort((a,b) => (b.dateSold||'').localeCompare(a.dateSold||''));
  }
  let html = '<table>' + tableHeaders(true);
  items.forEach(i => html += itemRow(i, true));
  if (!items.length) html += '<tr><td colspan="30" style="text-align:center;padding:24px;color:var(--text-dim)">No sold items yet</td></tr>';
  html += '</table>';
  document.getElementById('soldTable').innerHTML = html;
  applyColumnWidths('soldTable');
}

function renderLots() {
  let html = '';
  DATA.lots.forEach(lot => {
    const items = DATA.items.filter(i => i.lotId == lot.id);
    const sold = items.filter(i => i.listingStatus === 'Sold');
    const revenue = sold.reduce((s,i) => s + (Number(i.salePrice)||0), 0);
    const profit = sold.reduce((s,i) => s + (i.grossProfit||0), 0);
    html += `<div class="lot-card">
      <h3>Lot ${lot.id} <span style="font-size:12px;color:var(--text-dim)">${lot.date || ''}</span>
        <button class="btn btn-sm" onclick="showLotModal(${lot.id})">Edit</button>
      </h3>
      <div class="lot-stats">
        <div><span class="lot-stat-label">Auction:</span> ${fmt(lot.auctionPrice)}</div>
        <div><span class="lot-stat-label">Shipping/Fees:</span> ${fmt(lot.shippingFees)}</div>
        <div><span class="lot-stat-label">Other Costs:</span> ${fmt(lot.otherCosts)}</div>
        <div><span class="lot-stat-label">Total Cost:</span> <strong>${fmt(lot.totalCost)}</strong></div>
        <div><span class="lot-stat-label">Units:</span> ${lot.totalUnits}</div>
        <div><span class="lot-stat-label">Cost/Unit:</span> ${fmt(lot.costPerUnit)}</div>
        <div><span class="lot-stat-label">Items Tracked:</span> ${items.length}</div>
        <div><span class="lot-stat-label">Sold:</span> ${sold.length} / ${items.length}</div>
        <div><span class="lot-stat-label">Revenue:</span> ${fmt(revenue)}</div>
        <div><span class="lot-stat-label">Net Profit:</span> <span class="${profit>=0?'positive':'negative'}">${fmt(profit)}</span></div>
      </div>
      ${lot.notes ? `<div style="margin-top:8px;font-size:12px;color:var(--text-dim)">${lot.notes}</div>` : ''}
    </div>`;
  });
  if (!html) html = '<p style="color:var(--text-dim);padding:24px">No lots yet. Click "+ New Lot" to add one.</p>';
  document.getElementById('lotCards').innerHTML = '<div class="lot-cards">' + html + '</div>';
}

function updateLotFilters() {
  ['filterLot','filterOpenLot','filterSoldLot'].forEach(id => {
    const sel = document.getElementById(id);
    const val = sel.value;
    sel.innerHTML = '<option value="">All Lots</option>' + DATA.lots.map(l => `<option value="${l.id}">Lot ${l.id}</option>`).join('');
    sel.value = val;
  });
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jctc_inventory_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  toast('Data exported!');
}

function exportCSV() {
  DATA.items.forEach(i => calcItem(i));
  // Determine max listings across all items for dynamic columns
  const maxListings = Math.max(1, ...DATA.items.map(i => (i.listings || []).length));
  const baseHeaders = ['SKU','Lot','BStock #','Brand','Model','Category','Unit Cost','Powers On','Core Function','Accessories','Missing Items','Cosmetic Grade','Functional Grade','Tier','Listed Condition','Status'];
  const listingHeaders = [];
  for (let n = 1; n <= maxListings; n++) {
    const suffix = maxListings > 1 ? ` ${n}` : '';
    listingHeaders.push(`Channel${suffix}`, `List Price${suffix}`, `Date Listed${suffix}`);
  }
  const tailHeaders = ['Sale Price','Sold Platform','Date Sold','Payment Method','Platform Fees','Shipping Cost','Other Costs','Net Proceeds','Gross Profit','ROI%','MSRP','Notes'];
  const headers = [...baseHeaders, ...listingHeaders, ...tailHeaders];
  const rows = DATA.items.map(i => {
    const base = [i.sku,i.lotId,i.bstockItemCode||'',i.brand,i.model,i.category,i.unitCost,i.powersOn,i.coreFunction,i.accessories,i.missingItems,
      i.cosmeticGrade,i.functionalGrade,i.tier,i.listedCondition,statusLabel(i.listingStatus)];
    const listingCols = [];
    for (let n = 0; n < maxListings; n++) {
      const l = (i.listings || [])[n] || {};
      listingCols.push(l.channel || '', l.price || 0, l.dateListed || '');
    }
    const tail = [i.salePrice,i.soldPlatform,i.dateSold,i.paymentMethod,i.platformFees,i.shippingCost,i.otherCosts,
      i.netProceeds,i.grossProfit,i.roi,i.msrp,i.notes];
    return [...base, ...listingCols, ...tail].map(v => `"${(v==null?'':String(v)).replace(/"/g,'""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jctc_inventory_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('CSV exported!');
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const d = JSON.parse(e.target.result);
      if (d.lots && d.items) {
        if (!confirm(`Import ${d.items.length} items and ${d.lots.length} lots? This will REPLACE all current data.`)) return;
        // Clear existing data in Supabase
        await supabase.delete('items', 'sku=gt.0');
        await supabase.delete('lots', 'id=gt.0');
        // Insert lots
        if (d.lots.length) {
          const dbLots = d.lots.map(l => ({
            id: l.id, date: l.date || null,
            auction_price: l.auctionPrice || 0, shipping_fees: l.shippingFees || 0,
            other_costs: l.otherCosts || 0, total_units: l.totalUnits || 1,
            notes: l.notes || ''
          }));
          await supabase.insert('lots', dbLots);
        }
        // Insert items
        if (d.items.length) {
          const dbItems = d.items.map(i => jsToDb(i, ITEM_JS_TO_DB));
          // Insert in batches of 50 to avoid payload limits
          for (let idx = 0; idx < dbItems.length; idx += 50) {
            await supabase.insert('items', dbItems.slice(idx, idx + 50));
          }
        }
        // Update next_sku
        const maxSku = d.items.reduce((m, i) => Math.max(m, i.sku || 0), 0);
        await supabase.update('app_config', 'key=eq.next_sku', { value: String(maxSku + 1) });

        await loadData();
        updateLotFilters();
        renderCurrentView();
        updateBadges();
        toast('Data imported successfully!');
      } else {
        alert('Invalid data file.');
      }
    } catch(err) {
      console.error('Import error:', err);
      alert('Error importing file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== INIT =====
async function init() {
  // Show loading state
  document.getElementById('dashboardStats').innerHTML = '<div class="stat-card"><div class="label">Loading...</div><div class="value">Connecting to database</div></div>';

  await loadDropdownOptions();
  await loadData();
  updateLotFilters();
  updateCategorySelect();
  renderDashboard();
  updateBadges();
}

// Update the category dropdown in the Add Item modal to use dynamic options
function updateCategorySelect() {
  const sel = document.getElementById('itemCategory');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = DROPDOWN_OPTIONS.category.map(c => `<option${c===current?' selected':''}>${c}</option>`).join('');
}

function updateBadges() {
  const open = DATA.items.filter(i => i.listingStatus !== 'Sold').length;
  const sold = DATA.items.filter(i => i.listingStatus === 'Sold').length;
  document.querySelectorAll('.tab').forEach(t => {
    if (t.dataset.tab === 'open' && open > 0) t.innerHTML = `Open Inventory <span class="badge">${open}</span>`;
    if (t.dataset.tab === 'sold') t.innerHTML = `Sold Items <span class="badge">${sold}</span>`;
    if (t.dataset.tab === 'all') t.innerHTML = `All Inventory <span class="badge">${DATA.items.length}</span>`;
  });
  updateStaleBadges();
}

init();

// ===== RESIZABLE COLUMNS =====
// Persist column widths per table so re-renders preserve them
const _colWidths = {}; // key: tableWrapperId, value: { colIndex: widthPx }

function _getTableWrapperId(table) {
  const wrap = table.closest('.table-wrap');
  return wrap ? wrap.id : null;
}

// Apply saved widths after a table is rendered
function applyColumnWidths(tableWrapperId) {
  const widths = _colWidths[tableWrapperId];
  if (!widths) return;
  const wrap = document.getElementById(tableWrapperId);
  if (!wrap) return;
  const ths = wrap.querySelectorAll('th');
  ths.forEach((th, i) => {
    if (widths[i] != null) th.style.width = widths[i] + 'px';
  });
}

document.addEventListener('mousedown', function(e) {
  if (!e.target.classList.contains('col-resize')) return;
  e.preventDefault();
  e.stopPropagation(); // prevent sort click

  const handle = e.target;
  const th = handle.parentElement;
  const table = th.closest('table');
  const wrapId = _getTableWrapperId(table);
  const colIndex = Array.from(th.parentElement.children).indexOf(th);
  const startX = e.clientX;
  const startW = th.getBoundingClientRect().width;

  handle.classList.add('active');
  document.body.classList.add('col-resizing');

  function onMove(ev) {
    ev.preventDefault();
    const newW = Math.max(40, startW + (ev.clientX - startX));
    th.style.width = newW + 'px';
    // Save to persistence map
    if (wrapId) {
      if (!_colWidths[wrapId]) _colWidths[wrapId] = {};
      _colWidths[wrapId][colIndex] = newW;
    }
  }

  // Block the click event that fires after mouseup so sorting doesn't trigger
  function blockClick(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    document.removeEventListener('click', blockClick, true);
  }

  function onUp() {
    handle.classList.remove('active');
    document.body.classList.remove('col-resizing');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.addEventListener('click', blockClick, true);
    setTimeout(function() { document.removeEventListener('click', blockClick, true); }, 100);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// ===== DROPDOWN EDITOR (right-click on column headers) =====
let _editingDropdownField = null;
let _editingDropdownOptions = [];

// Right-click on any table header to edit its dropdown options
document.addEventListener('contextmenu', function(e) {
  const th = e.target.closest('th[data-sort-field]');
  if (!th) return;
  const field = th.dataset.sortField;
  if (!EDITABLE_DROPDOWNS.includes(field)) return;

  e.preventDefault();
  openDropdownEditor(field);
});

function openDropdownEditor(field) {
  _editingDropdownField = field;
  _editingDropdownOptions = DROPDOWN_OPTIONS[field].slice();
  document.getElementById('dropdownModalTitle').textContent = 'Edit ' + DROPDOWN_LABELS[field] + ' Options';
  document.getElementById('dropdownNewOption').value = '';
  renderDropdownEditorList();
  document.getElementById('dropdownModal').classList.add('show');
}

function closeDropdownModal() {
  document.getElementById('dropdownModal').classList.remove('show');
  _editingDropdownField = null;
  _editingDropdownOptions = [];
}

function renderDropdownEditorList() {
  const container = document.getElementById('dropdownOptionsList');
  container.innerHTML = _editingDropdownOptions.map((opt, i) => {
    const isBlank = opt === '';
    const displayLabel = isBlank ? '(blank)' : opt;
    const labelClass = isBlank ? 'opt-label empty-opt' : 'opt-label';
    return `<div class="dropdown-opt-item" draggable="true" data-idx="${i}"
      ondragstart="ddDragStart(event)" ondragover="ddDragOver(event)" ondragleave="ddDragLeave(event)" ondrop="ddDrop(event)">
      <span class="opt-drag">⠿</span>
      <span class="${labelClass}">${displayLabel}</span>
      <button class="opt-remove" onclick="removeDropdownOption(${i})" title="Remove">&times;</button>
    </div>`;
  }).join('');
}

function addDropdownOption() {
  const input = document.getElementById('dropdownNewOption');
  const val = input.value.trim();
  if (!val) return;
  if (_editingDropdownOptions.includes(val)) { toast('Option already exists'); return; }
  _editingDropdownOptions.push(val);
  input.value = '';
  renderDropdownEditorList();
}

// Allow Enter key to add option
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'dropdownNewOption') {
    e.preventDefault();
    addDropdownOption();
  }
});

function removeDropdownOption(idx) {
  _editingDropdownOptions.splice(idx, 1);
  renderDropdownEditorList();
}

// Drag-and-drop reordering
let _ddDragIdx = null;
function ddDragStart(e) {
  _ddDragIdx = Number(e.currentTarget.dataset.idx);
  e.dataTransfer.effectAllowed = 'move';
}
function ddDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function ddDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function ddDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const targetIdx = Number(e.currentTarget.dataset.idx);
  if (_ddDragIdx == null || _ddDragIdx === targetIdx) return;
  const item = _editingDropdownOptions.splice(_ddDragIdx, 1)[0];
  _editingDropdownOptions.splice(targetIdx, 0, item);
  _ddDragIdx = null;
  renderDropdownEditorList();
}

async function saveDropdownChanges() {
  if (!_editingDropdownField) return;
  DROPDOWN_OPTIONS[_editingDropdownField] = _editingDropdownOptions.slice();
  await saveDropdownOptions();
  closeDropdownModal();
  updateCategorySelect();
  renderCurrentView();
  toast(DROPDOWN_LABELS[_editingDropdownField] + ' options updated!');
}
