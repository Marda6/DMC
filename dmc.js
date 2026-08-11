/* ============================================================================
   ENCY Core — Digital Machine Center prototype. All data is generated locally
   (seeded, so every reload shows the same catalog). No backend.
   ========================================================================= */
'use strict';

/* ------------------------------------------------------------- helpers ---- */
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, cls, html) => { const n = document.createElement(tag);
  if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const fmt = n => n.toLocaleString('en-US');

/* seeded RNG so the generated catalog is stable across reloads */
function mulberry32(a) { return function () {
  a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20260810);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

/* ---------------------------------------------------------------- data ---- */
/* machine makers: monogram + brand hue for the identity plate */
const MAKERS = [
  { name:'DMG MORI',    mono:'DM', c:'#16191b' },
  { name:'Mazak',       mono:'MZ', c:'#0068b7' },
  { name:'Okuma',       mono:'OK', c:'#00794e' },
  { name:'Haas',        mono:'HS', c:'#cc0000' },
  { name:'Hermle',      mono:'HE', c:'#005ca9' },
  { name:'Makino',      mono:'MK', c:'#005baa' },
  { name:'Matsuura',    mono:'MA', c:'#e60027' },
  { name:'Hyundai WIA', mono:'HW', c:'#002c5f' },
  { name:'Doosan',      mono:'DS', c:'#1c3f94' },
  { name:'Victor',      mono:'VI', c:'#c8102e' },
  { name:'Hurco',       mono:'HU', c:'#00609c' },
  { name:'Spinner',     mono:'SP', c:'#333f48' },
  { name:'Abamet',      mono:'AB', c:'#4a5560' },
  { name:'Accuway',     mono:'AC', c:'#0a7a8a' },
  { name:'Akira Seiki', mono:'AS', c:'#8a2432' },
  { name:'Awea',        mono:'AW', c:'#245c8a' },
  { name:'Baofeng',     mono:'BF', c:'#7a4fd6' },
  { name:'Chevalier',   mono:'CH', c:'#2f6f4f' },
  { name:'Emco',        mono:'EM', c:'#00654e' },
  { name:'Feeler',      mono:'FE', c:'#5b6770' },
];
/* control makers: the post/interpreter identity */
const CONTROLS = [
  { name:'Fanuc',      mono:'FA', c:'#c7a500',
    models:['30i','30i-B','31i','31i-B5','21i','18i-MB5','0i-TF','0i-TD','30i-A','30i-B Plus'] },
  { name:'Siemens',    mono:'SI', c:'#009999',
    models:['Sinumerik 840D','Sinumerik 828D','Sinumerik 808D','Sinumerik One'] },
  { name:'Heidenhain', mono:'HH', c:'#7d8a12',
    models:['TNC 640','iTNC 530','CNC Pilot 620','CNC Pilot 4290','TNC 320'] },
  { name:'Mitsubishi', mono:'MI', c:'#e60012', models:['M700','M730','M800','M80'] },
  { name:'Haas',       mono:'HS', c:'#cc0000', models:['NGC','Classic'] },
  { name:'Mazak',      mono:'MZ', c:'#0068b7', models:['Matrix 2','SmoothX','SmoothG'] },
  { name:'Okuma',      mono:'OK', c:'#00794e', models:['OSP-P300','OSP-P200'] },
];
const TYPES = ['Milling','Turn','Mill Turn','Wire EDM','Swiss','Additive','Laser'];
const TYPE_W = [.34, .22, .22, .07, .07, .04, .04]; // rough share per type
const SERIES = { 'DMG MORI':['CLX','NLX','NTX','NMV','DMU','CMX','ecoTurn','monoBLOCK','NZX','NEF'],
  Mazak:['Integrex','Quick Turn','VCN','Variaxis','HCN'], Okuma:['Genos','LB','MB','Multus'],
  Haas:['VF','ST','UMC','Mini Mill'], Hermle:['C','B'], Makino:['PS','DA','a'],
  Matsuura:['MX','H.Plus','MAM72'], 'Hyundai WIA':['KF','XF','L','HD'],
  Doosan:['DNM','Puma','Lynx'], Victor:['Vturn','Vcenter'], Hurco:['VMX','TM'],
  Spinner:['TC','VC'], Abamet:['AM'], Accuway:['UM'], 'Akira Seiki':['SV','SR'],
  Awea:['BM','LP'], Baofeng:['BF'], Chevalier:['FVM','QP'], Emco:['Hyperturn','Maxxturn'],
  Feeler:['FV','FT'] };
/* optional equipment a physical machine can carry (schemas and kits) */
const OPTIONS = ['4th axis','5th axis','Probe','Tool setter','Sub-spindle','Live tooling',
  'Bar feeder','Tailstock','Steady rest','Pallet changer','Chip conveyor','Through coolant',
  'Y axis','Tool magazine 40'];
const PUBLISHERS = ['ENCY Software Ltd','Postworks GmbH','CAM Guild','MillwrightSoft'];
const PUB_W = [.82, .08, .06, .04];
const wpick = (arr, w) => { let x = rnd(), i = 0;
  for (; i < w.length - 1 && x >= w[i]; x -= w[i], i++); return arr[i]; };

function workArea(type) {
  if (type === 'Turn' || type === 'Swiss')
    return { x: ri(4, 40) * 10, y: null, z: ri(30, 200) * 10 };
  return { x: ri(20, 400) * 10, y: ri(5, 105) * 10, z: ri(32, 78) * 10 };
}
const KINDS = { post:'Post Processor', interp:'Interpreter', schema:'Machine Schema', kit:'Kit' };
let seq = 1;
function product(kind, extra) {
  const type = wpick(TYPES, TYPE_W);
  const maker = pick(MAKERS);
  const series = pick(SERIES[maker.name]);
  const model = series + ' ' + (ri(1, 9) * (rnd() < .5 ? 10 : 100) + (rnd() < .3 ? 5 : 0));
  const ctrl = pick(CONTROLS);
  return Object.assign({
    id: seq++, kind, type, maker: maker.name, series, model,
    control: ctrl.name, ctrlModel: ctrl.name + ' ' + pick(ctrl.models),
    axes: wpick([2,3,4,5,6], [.08,.34,.22,.3,.06]),
    wa: rnd() < .82 ? workArea(type) : null,
    units: wpick(['Metric','Inch'], [.78,.22]),
    publisher: wpick(PUBLISHERS, PUB_W),
    price: wpick(['Free','Maintenance','Paid'], [.34,.33,.33]),
    priceVal: ri(19, 199) * 10,
    dl: ri(20, 4200), ts: ri(1, 900), got: rnd() < .04,
  }, extra);
}

const DATA = [];
for (let i = 0; i < 57; i++) { const c = pick(CONTROLS);
  DATA.push(product('post', { name: pick(c.models), brand: c, control: c.name })); }
['Fanuc','Siemens','Heidenhain','Mitsubishi','Okuma'].forEach(n => {
  const c = CONTROLS.find(k => k.name === n);
  DATA.push(product('interp', { name: n + ' G-code', brand: c, control: n })); });
for (let i = 0; i < 507; i++) { const p = product('schema');
  p.name = p.maker + ' ' + p.model; p.brand = MAKERS.find(m => m.name === p.maker);
  DATA.push(p); }
for (let i = 0; i < 2; i++) { const p = product('kit');
  p.name = p.maker + ' ' + p.model + ' Kit'; p.brand = MAKERS.find(m => m.name === p.maker);
  DATA.push(p); }
/* post/interp names carry the control family (e.g. "Fanuc 31i-B5");
   work area only makes sense where the product contains a machine */
DATA.forEach(p => {
  if (p.kind === 'post') p.name = p.control + ' ' + p.name;
  if (p.kind === 'post' || p.kind === 'interp') p.wa = null;
});
/* optional equipment: 0–5 picks per machine-bearing product */
DATA.forEach(p => {
  if (p.kind !== 'schema' && p.kind !== 'kit') { p.opts = []; return; }
  const n = wpick([0,1,2,3,4,5], [.18,.2,.22,.18,.12,.1]);
  const pool = [...OPTIONS]; p.opts = [];
  for (let i = 0; i < n; i++) p.opts.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
});

/* sample machine shots: two example renders spread over the schemas/kits
   (every other schema keeps the placeholder so both states stay visible) */
const SHOTS = ['assets/shots/machine-1.webp', 'assets/shots/machine-2.webp'];
DATA.forEach((p, i) => {
  if (p.kind === 'schema' || p.kind === 'kit') {
    if (i % 3 !== 0) p.photo = SHOTS[i % SHOTS.length];
  }
});

/* ---------------------------------------------------------------- state --- */
const S = {
  scope: 'all', q: '', sort: 'recent', view: 'grid',
  makers: new Set(), controls: new Set(), types: new Set(), axes: new Set(),
  pubs: new Set(), units: new Set(), prices: new Set(),
  wa: { x: [200, 4000], y: [50, 1050], z: [320, 780] },
  makerQ: '', makerMore: false, ctrlMore: false, shown: 0,
};
const WA_BOUNDS = { x: [200, 4000], y: [50, 1050], z: [320, 780] };

/* ------------------------------------------------------------- filtering -- */
function waActive(ax) { return S.wa[ax][0] > WA_BOUNDS[ax][0] || S.wa[ax][1] < WA_BOUNDS[ax][1]; }
function matches(p, skip) {
  if (skip !== 'scope' && S.scope !== 'all' && p.kind !== S.scope) return false;
  if (skip !== 'maker' && S.makers.size && !S.makers.has(p.maker)) return false;
  if (skip !== 'ctrl' && S.controls.size && !S.controls.has(p.control)) return false;
  if (skip !== 'type' && S.types.size && !S.types.has(p.type)) return false;
  if (skip !== 'axes' && S.axes.size && !S.axes.has(Math.min(p.axes, 6))) return false;
  if (skip !== 'pub' && S.pubs.size && !S.pubs.has(p.publisher)) return false;
  if (skip !== 'units' && S.units.size && !S.units.has(p.units)) return false;
  if (skip !== 'price' && S.prices.size && !S.prices.has(p.price)) return false;
  if (skip !== 'wa') for (const ax of ['x','y','z']) {
    if (!waActive(ax)) continue;
    const v = p.wa && p.wa[ax];
    if (v == null || v < S.wa[ax][0] || v > S.wa[ax][1]) return false;
  }
  if (S.q) { const q = S.q.toLowerCase();
    if (!(p.name + ' ' + p.maker + ' ' + p.control + ' ' + p.ctrlModel + ' ' + p.series)
      .toLowerCase().includes(q)) return false; }
  return true;
}
const SORTS = { recent: (a,b) => a.ts - b.ts, name: (a,b) => a.name.localeCompare(b.name),
  downloads: (a,b) => b.dl - a.dl };
function results() { return DATA.filter(p => matches(p)).sort(SORTS[S.sort]); }

/* ------------------------------------------------------------- rendering -- */
/* sizes render in the product's own units — Units is a fact filter, not a
   display toggle. Sliders keep mm (the sidebar's shared scale). */
const mm = v => v + ' mm';
/* card fact: unit lives in the label ("Work area, mm"), the value is bare
   numbers — X × Y × Z in the machine's own units */
function waLabel(p) { return 'Work area, ' + (p.units === 'Inch' ? 'in' : 'mm'); }
function waText(p) { if (!p.wa) return '—';
  const v = n => p.units === 'Inch' ? (n / 25.4).toFixed(1) : n;
  return [p.wa.x, p.wa.y, p.wa.z].filter(n => n != null).map(v).join(' × '); }
function priceHtml(p) {
  if (p.price === 'Free') return '<span class="price-free">Free</span>';
  if (p.price === 'Maintenance') return '<span class="price-note">In maintenance</span>';
  return `<span class="price-val">$${fmt(p.priceVal)}</span>`; }
const logo = (p, cls) => `<span class="mlogo ${cls}" style="--bc:${p.brand.c}">${p.brand.mono}</span>`;

function cardHtml(p) {
  /* facts follow the kind: Work area only exists where there is a physical
     machine (schema, kit); Machine names the target everywhere but on the
     schema card, whose title already is the machine */
  const kv = [];
  if (p.kind === 'schema') kv.push(['Control', esc(p.control)]);
  else { kv.push(['Control', esc(p.ctrlModel)]);
    kv.push(['Machine', esc(p.maker + ' ' + p.model)]); }
  kv.push(['Type', esc(p.type)], ['Axes', p.axes >= 6 ? '6+' : p.axes]);
  if (p.kind === 'schema' || p.kind === 'kit') {
    kv.push([waLabel(p), waText(p)]);
    kv.push(['Equipment', p.opts.length
      ? `<span class="kv-opts">${p.opts.map(o => `<span class="xtag">${esc(o)}</span>`).join('')
        }<span class="xtag xtag--more" hidden></span></span>`
      : '—']);
  }
  /* photo slot: real machine/control shots later; the placeholder is a quiet
     plate with the product-kind glyph so cards keep their height today */
  const KGLYPH = { post:'k-post', interp:'k-interp', schema:'k-schema', kit:'k-kit' };
  return `<div class="mcard__photo${p.photo ? '' : ' is-empty'}">${p.photo
      ? `<img src="${p.photo}" alt="" loading="lazy">`
      : `<svg><use href="#${KGLYPH[p.kind]}"/></svg>`}
    </div>
    <div class="mcard__head">
    <span class="klogo klogo--${p.kind}">${KINDS[p.kind][0]}</span>
    <div class="mcard__htext">
      <div class="mcard__name">${esc(p.name)}</div>
    </div></div>
    <div class="mcard__kv">${kv.map(([k,v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>
    <div class="mcard__foot"><span class="mcard__kind">${KINDS[p.kind]}</span>
      <span class="mcard__fspacer"></span>${priceHtml(p)}</div>`;
}
/* table row: one fact per column, so the list scans vertically */
function waShort(p) { if (!p.wa) return '—';
  const inch = p.units === 'Inch';
  const v = n => inch ? (n / 25.4).toFixed(1) : n;
  return [p.wa.x, p.wa.y, p.wa.z].filter(n => n != null).map(v).join(' × ')
    + (inch ? ' ″' : ' mm'); }
function rowHtml(p) {
  const KGLYPH = { post:'k-post', interp:'k-interp', schema:'k-schema', kit:'k-kit' };
  return `<td><div class="mtable__id">
      <span class="mtable__thumb${p.photo ? '' : ' is-empty'}">${p.photo
        ? `<img src="${p.photo}" alt="" loading="lazy">`
        : `<svg><use href="#${KGLYPH[p.kind]}"/></svg>`}</span>
      <div class="mtable__idtext">
        <span class="mtable__name">${esc(p.name)}</span>
        <span class="mtable__sub">${esc(p.publisher)}</span>
      </div></div></td>
    <td class="c-kind"><span class="kindtag kindtag--${p.kind}">${KINDS[p.kind]}</span></td>
    <td class="c-mach${p.kind === 'schema' ? ' dim' : ''}">${p.kind === 'schema'
      ? '—' : esc(p.maker + ' ' + p.model)}</td>
    <td class="c-type dim">${esc(p.type)}</td>
    <td class="c-ctrl dim">${p.kind === 'schema' ? esc(p.control) : esc(p.ctrlModel)}</td>
    <td class="c-ax num">${p.axes >= 6 ? '6+' : p.axes}</td>
    <td class="c-wa dim num">${waShort(p)}</td>
    <td class="c-dl num dim">${fmt(p.dl)}</td>
    <td class="c-price num">${priceHtml(p)}</td>`;
}
const TABLE_HEAD = `<thead><tr>
  <th>Product</th><th class="c-kind">Category</th>
  <th class="c-mach">Machine</th><th class="c-type">Type</th>
  <th class="c-ctrl">Control</th><th class="c-ax num">Axes</th>
  <th class="c-wa num">Work area</th><th class="c-dl num">Downloads</th>
  <th class="c-price num">Price</th></tr></thead>`;

/* trim the Options row to what actually fits: drop trailing tags and grow
   the "+N" counter instead of ever showing an ellipsis */
function fitOpts(card) {
  const cell = $('.kv-opts', card); if (!cell) return;
  const more = $('.xtag--more', cell);
  let hidden = 0;
  const overflows = () => cell.scrollWidth > cell.clientWidth + 1;
  while (overflows()) {
    const tags = cell.querySelectorAll('.xtag:not(.xtag--more)');
    if (tags.length <= 1) break;
    tags[tags.length - 1].remove(); hidden++;
    more.hidden = false; more.textContent = '+' + hidden;
  }
}

const CHUNK = 60;
let current = [];
function renderCatalog(reset) {
  const body = $('#storeBody');
  if (reset !== false) { current = results(); S.shown = 0; body.innerHTML = ''; }
  $('#storeCnt').textContent = fmt(current.length);
  $('#storeTitle').textContent = S.scope === 'all' ? 'All products'
    : KINDS[S.scope] + (S.scope === 'kit' || S.scope === 'schema' ? 's' : 's');
  let host = body.firstElementChild;
  if (!host || !host.dataset.host) {
    if (S.view === 'grid') { host = el('div', 'mgrid'); }
    else { host = el('div', 'mtablewrap', `<table class="mtable">${TABLE_HEAD}<tbody></tbody></table>`); }
    host.dataset.host = '1';
    body.appendChild(host);
  }
  const slot = S.view === 'grid' ? host : $('tbody', host);
  const end = Math.min(current.length, S.shown + CHUNK);
  for (let i = S.shown; i < end; i++) {
    const p = current[i];
    const n = S.view === 'grid' ? el('button', 'mcard', cardHtml(p)) : el('tr', '', rowHtml(p));
    n.dataset.id = p.id; slot.appendChild(n);
    if (S.view === 'grid') fitOpts(n);
  }
  S.shown = end;
  let mark = $('.moremark', body);
  if (S.shown < current.length) {
    if (!mark) { mark = el('div', 'moremark'); body.appendChild(mark); }
    mark.textContent = fmt(current.length - S.shown) + ' more — scroll to load';
  } else if (mark) mark.remove();
  if (!current.length) {
    host.remove();
    body.innerHTML = `<div class="empty"><svg><use href="#i-search"/></svg>
      <b>Nothing matches</b><span>Try clearing a filter or the search query</span></div>`;
  }
}
$('#storeBody').addEventListener('scroll', e => {
  const b = e.target;
  if (S.shown < current.length && b.scrollTop + b.clientHeight > b.scrollHeight - 600)
    renderCatalog(false);
});
$('#storeBody').addEventListener('click', e => {
  if (e.target.closest('[data-id]')) toast('Product page — next iteration');
});

/* ------------------------------------------------------------- sidebar ---- */
function counts(field, skip) {
  const m = new Map();
  DATA.forEach(p => { if (matches(p, skip)) m.set(p[field], (m.get(p[field]) || 0) + 1); });
  return m;
}
function checkRows(host, names, set, cntMap, limit, more, onMore) {
  host.innerHTML = '';
  const shown = more || names.length <= limit ? names : names.slice(0, limit);
  shown.forEach(n => {
    const c = cntMap.get(n) || 0;
    const b = el('button', 'frow' + (set.has(n) ? ' is-on' : '') + (!c && !set.has(n) ? ' is-dim' : ''),
      `<span class="frow__check"><svg><use href="#i-check-b"/></svg></span>
       <span>${esc(n)}</span><i class="frow__cnt">${fmt(c)}</i>`);
    b.onclick = () => { set.has(n) ? set.delete(n) : set.add(n); update(); };
    host.appendChild(b);
  });
  if (names.length > limit) {
    const b = el('button', 'fmore', more ? 'Show less' : `+ Show ${names.length - shown.length} more`);
    b.onclick = onMore; host.appendChild(b);
  }
}
function renderSide() {
  /* machine manufacturer (searchable, clipped to 8) */
  const mCnt = counts('maker', 'maker');
  let makers = MAKERS.map(m => m.name).sort((a,b) => (mCnt.get(b)||0) - (mCnt.get(a)||0));
  if (S.makerQ) makers = makers.filter(n => n.toLowerCase().includes(S.makerQ.toLowerCase()));
  checkRows($('#mmfrRows'), makers, S.makers, mCnt, 8, S.makerMore,
    () => { S.makerMore = !S.makerMore; renderSide(); });
  /* control manufacturer */
  const cCnt = counts('control', 'ctrl');
  checkRows($('#cmfrRows'), CONTROLS.map(c => c.name), S.controls, cCnt, 7, S.ctrlMore,
    () => { S.ctrlMore = !S.ctrlMore; renderSide(); });
  /* machine type */
  checkRows($('#typeRows'), TYPES, S.types, counts('type', 'type'), 7, true, null);
  /* publisher */
  checkRows($('#pubRows'), PUBLISHERS, S.pubs, counts('publisher', 'pub'), 4, true, null);
  /* axes chips */
  const ax = $('#axChips'); ax.innerHTML = '';
  [2,3,4,5,6].forEach(n => {
    const b = el('button', 'axchip' + (S.axes.has(n) ? ' is-on' : ''), n === 6 ? '6+' : n);
    b.onclick = () => { S.axes.has(n) ? S.axes.delete(n) : S.axes.add(n); update(); };
    ax.appendChild(b);
  });
  /* units + price: fact filters like the rest */
  checkRows($('#unitRows'), ['Metric','Inch'], S.units, counts('units', 'units'), 2, true, null);
  checkRows($('#priceRows'), ['Free','Maintenance','Paid'], S.prices,
    counts('price', 'price'), 3, true, null);
  renderWa();
  /* section badges: how many picks are applied inside each group */
  const waCnt = ['x','y','z'].filter(waActive).length;
  const SEC_N = { maker: S.makers.size, ctrl: S.controls.size, type: S.types.size,
    axes: S.axes.size, wa: waCnt, price: S.prices.size, units: S.units.size,
    pubs: 0, pub: S.pubs.size };
  document.querySelectorAll('.fsec').forEach(sec =>
    sec.classList.toggle('is-active', !!(SEC_N[sec.dataset.sec])));
  /* panel title carries the grand total of applied picks */
  const total = Object.values(SEC_N).reduce((a, b) => a + b, 0);
  const sideCnt = $('#sideCnt');
  sideCnt.hidden = !total; sideCnt.textContent = total;
  /* funnel badge counts active filter groups */
  const n = [S.makers.size && 1, S.controls.size && 1, S.types.size && 1, S.axes.size && 1,
    S.pubs.size && 1, S.units.size && 1, S.prices.size && 1,
    (waActive('x') || waActive('y') || waActive('z')) && 1]
    .filter(Boolean).length;
  const badge = $('#funnelCnt');
  badge.hidden = !n; badge.textContent = n;
}

/* work-area dual ranges */
function renderWa() {
  const host = $('#waRanges'); host.innerHTML = '';
  ['x','y','z'].forEach(ax => {
    const [min, max] = WA_BOUNDS[ax], [lo, hi] = S.wa[ax];
    const wrap = el('div', 'wa', `<div class="wa__row">
        <span class="wa__axis">${ax.toUpperCase()}</span>
        <span class="wa__val">${mm(lo)} – ${mm(hi)}</span></div>
      <div class="range">
        <div class="range__track"><div class="range__fill"></div></div>
        <input type="range" min="${min}" max="${max}" step="10" value="${lo}" data-t="0">
        <input type="range" min="${min}" max="${max}" step="10" value="${hi}" data-t="1">
      </div>`);
    const fill = $('.range__fill', wrap);
    const pos = () => { fill.style.left = ((S.wa[ax][0] - min) / (max - min) * 100) + '%';
      fill.style.right = (100 - (S.wa[ax][1] - min) / (max - min) * 100) + '%'; };
    pos();
    wrap.querySelectorAll('input').forEach(inp => {
      inp.oninput = () => { const t = +inp.dataset.t, v = +inp.value;
        S.wa[ax][t] = t ? Math.max(v, S.wa[ax][0]) : Math.min(v, S.wa[ax][1]);
        inp.value = S.wa[ax][t]; pos();
        $('.wa__val', wrap).textContent = mm(S.wa[ax][0]) + ' – ' + mm(S.wa[ax][1]); };
      inp.onchange = update;
    });
    host.appendChild(wrap);
  });
}

/* ------------------------------------------------------------- header ----- */
function renderScope() {
  const seg = $('#scopeSeg'); seg.innerHTML = '';
  const per = k => DATA.filter(p => k === 'all' || p.kind === k).length;
  [['all','All'],['post','Post Processor'],['interp','Interpreter'],
   ['schema','Machine Schema'],['kit','Kit']].forEach(([v, l]) => {
    const b = el('button', S.scope === v ? `is-on seg--${v}` : '',
      `${l}<i class="seg__n">${fmt(per(v))}</i>`);
    b.onclick = () => { S.scope = v; update(); };
    seg.appendChild(b);
  });
}
/* collapse/expand filter sections */
document.querySelectorAll('.fsec__head').forEach(h =>
  h.addEventListener('click', () => h.closest('.fsec').classList.toggle('is-closed')));
/* per-group clear (shown only while the group filters something) */
const SEC_CLEAR = { maker: () => S.makers.clear(), ctrl: () => S.controls.clear(),
  type: () => S.types.clear(), axes: () => S.axes.clear(),
  wa: () => { S.wa = { x: [...WA_BOUNDS.x], y: [...WA_BOUNDS.y], z: [...WA_BOUNDS.z] }; },
  price: () => S.prices.clear(), units: () => S.units.clear(), pub: () => S.pubs.clear() };
document.querySelectorAll('.fsec__clear').forEach(b =>
  b.addEventListener('click', () => {
    SEC_CLEAR[b.closest('.fsec').dataset.sec]?.(); update(); }));

$('#searchField').addEventListener('input', e => { S.q = e.target.value.trim(); update(); });
$('#mmfrSearch').addEventListener('input', e => { S.makerQ = e.target.value.trim(); renderSide(); });
$('#resetBtn').onclick = () => {
  S.makers.clear(); S.controls.clear(); S.types.clear(); S.axes.clear();
  S.pubs.clear(); S.units.clear(); S.prices.clear();
  S.wa = { x: [...WA_BOUNDS.x], y: [...WA_BOUNDS.y], z: [...WA_BOUNDS.z] };
  S.makerQ = ''; $('#mmfrSearch').value = ''; update();
};
$('#funnelBtn').onclick = () => { const side = $('#side');
  side.hidden = !side.hidden; $('#funnelBtn').classList.toggle('is-on', side.hidden); };
$('#viewMode').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  S.view = b.dataset.mode;
  $('#viewMode').querySelectorAll('button').forEach(x =>
    x.classList.toggle('is-active', x === b));
  renderCatalog();
});
$('#pubBtn').onclick = () => toast('Publishing flow — next iteration');

/* preview toggle: hides the photo band / table thumbs, remembered locally */
function syncPreview() {
  const on = localStorage.getItem('dmc-preview') !== 'off';
  $('.app').classList.toggle('no-preview', !on);
  $('#prevBtn').classList.toggle('is-on', on);
}
$('#prevBtn').onclick = () => {
  const on = localStorage.getItem('dmc-preview') !== 'off';
  localStorage.setItem('dmc-preview', on ? 'off' : 'on');
  syncPreview();
};
syncPreview();

/* sort + user popovers */
function menu(host, anchor, items, onPick) {
  host.innerHTML = '';
  items.forEach(([v, l, on]) => {
    const b = el('button', on ? 'is-checked' : '',
      `<svg class="ck"><use href="#i-check"/></svg>${l}`);
    b.onclick = () => { host.hidden = true; onPick(v); };
    host.appendChild(b);
  });
  const r = anchor.getBoundingClientRect();
  host.hidden = false;
  host.style.top = (r.bottom + 4) + 'px';
  host.style.left = Math.min(r.left, innerWidth - host.offsetWidth - 8) + 'px';
}
$('#sortBtn').onclick = e => { e.stopPropagation();
  menu($('#sortMenu'), $('#sortBtn'), [
    ['recent','Recent', S.sort === 'recent'], ['name','Name', S.sort === 'name'],
    ['downloads','Downloads', S.sort === 'downloads']],
    v => { S.sort = v;
      $('#sortLabel').textContent = { recent:'Recent', name:'Name', downloads:'Downloads' }[v];
      renderCatalog(); }); };
$('#userBtn').onclick = e => { e.stopPropagation();
  const m = $('#userMenu'); const r = $('#userBtn').getBoundingClientRect();
  m.hidden = !m.hidden;
  m.style.top = (r.bottom + 4) + 'px';
  m.style.left = Math.min(r.right - 200, innerWidth - 208) + 'px'; };
$('#userMenu').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#userMenu').hidden = true;
  if (b.dataset.uact === 'theme') {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ency-theme', next);
    syncThemeRow();
  } else toast('Stubbed in this prototype');
});
function syncThemeRow() {
  const light = document.documentElement.dataset.theme === 'light';
  $('#themeLabel').textContent = light ? 'Light theme' : 'Dark theme';
  $('#userMenu .th-moon').style.display = light ? 'none' : 'block';
  $('#userMenu .th-sun').style.display = light ? 'block' : 'none';
}
document.addEventListener('click', () => { $('#sortMenu').hidden = true; $('#userMenu').hidden = true; });

/* toast */
let toastTimer;
function toast(msg) { const t = $('#toast');
  t.innerHTML = `<svg><use href="#i-check-circle"/></svg>${esc(msg)}`;
  t.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-shown'), 2400); }

/* ------------------------------------------------------------- boot ------- */
function update() { renderScope(); renderSide(); renderCatalog(); }
syncThemeRow();
update();
