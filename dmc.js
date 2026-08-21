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
    fav: rnd() < .03, mine: rnd() < .012,
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
  page: 'catalog', acctSec: 'profile', sideHidden: false,
  scope: 'all', q: '', sort: 'recent', view: 'grid', favOnly: false,
  makers: new Set(), controls: new Set(), types: new Set(), axes: new Set(),
  pubs: new Set(), units: new Set(), prices: new Set(),
  wa: { x: [200, 4000], y: [50, 1050], z: [320, 780] },
  makerQ: '', makerMore: false, ctrlMore: false, shown: 0,
};
const WA_BOUNDS = { x: [200, 4000], y: [50, 1050], z: [320, 780] };

/* ------------------------------------------------------------- filtering -- */
function waActive(ax) { return S.wa[ax][0] > WA_BOUNDS[ax][0] || S.wa[ax][1] < WA_BOUNDS[ax][1]; }
function matches(p, skip) {
  if (S.favOnly && !p.fav) return false;
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
  return `<span class="cstar${p.fav ? ' is-on' : ''}" data-fav title="Favorite">
      <svg><use href="#${p.fav ? 'i-star-fill' : 'i-star'}"/></svg></span>
    <div class="mcard__photo${p.photo ? '' : ' is-empty'}">${p.photo
      ? `<img src="${p.photo}" alt="" loading="lazy">`
      : `<svg><use href="#${KGLYPH[p.kind]}"/></svg>`}
    </div>
    <div class="mcard__head">
    <div class="mcard__htext">
      <div class="mcard__name">${esc(p.name)}</div>
    </div></div>
    <div class="mcard__kv">${kv.map(([k,v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>
    <div class="mcard__foot"><span class="kindtag kindtag--${p.kind}">${KINDS[p.kind]}</span>
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
  $('#storeTitle').textContent = (S.favOnly ? 'Favorites · ' : '')
    + (S.scope === 'all' ? 'All products' : KINDS[S.scope] + 's');
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
  if (S.page === 'catalog' && S.shown < current.length
    && b.scrollTop + b.clientHeight > b.scrollHeight - 600)
    renderCatalog(false);
});
$('#storeBody').addEventListener('click', e => {
  const n = e.target.closest('[data-id]');
  if (!n) return;
  const p = DATA.find(x => x.id == n.dataset.id);
  const star = e.target.closest('[data-fav]');
  if (star) {
    e.stopPropagation();
    p.fav = !p.fav;
    star.classList.toggle('is-on', p.fav);
    star.innerHTML = `<svg><use href="#${p.fav ? 'i-star-fill' : 'i-star'}"/></svg>`;
    if (S.favOnly) renderCatalog();
    else toast(p.fav ? 'Added to favorites' : 'Removed from favorites');
    return;
  }
  openDetail(p);
});

/* ------------------------------------------------------- product view ---- */
const KGLYPH = { post:'k-post', interp:'k-interp', schema:'k-schema', kit:'k-kit' };
const ABOUT = {
  post: p => [`${p.name} is a production post processor for ${p.ctrlModel} controls, tuned for the ${p.maker} ${p.model} (${p.type.toLowerCase()}, ${p.axes >= 6 ? '6+' : p.axes} axes). It maps every toolpath ENCY produces to controller-native cycles, keeps canned drilling and threading cycles intact, and emits arc, helix and TCP moves without linearization where the control allows it.`,
    `The post ships with a machine-limits model — travels, spindle and feed caps, tool-change clearances — so the output is checked against the physical envelope before a single line of G-code leaves ENCY. Program headers, tool tables and operator comments follow the shop-floor conventions used by ${p.publisher}.`],
  interp: p => [`${p.name} interpreter parses ${p.control} programs back into toolpath ENCY can display and verify. It resolves modal state, subprograms, cutter compensation and cycle expansion, so legacy programs can be simulated against the machine schema before they ever reach the shop floor.`],
  schema: p => [`A complete digital twin of the ${p.name}: kinematics, travels, spindle and turret geometry, fixtures and the ${p.control} control panel layout. Drop it into ENCY to run collision-checked simulation and time estimation against the real machine envelope.`,
    `The schema is measured from vendor documentation and verified on the machine. Work area, axis limits and tool-change positions match the ${p.series} series datasheet.`],
  kit: p => [`Everything the ${p.maker} ${p.model} needs to go live in ENCY: the machine schema, a matched post processor for the ${p.ctrlModel}, and the control's interpreter — installed together and verified as one set.`],
};
const fmtDate = d => String(d.getDate()).padStart(2, '0') + '/'
  + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
const fsec = (title, pairs) => `<section class="dsec"><div class="dsec__h">${title}</div>
  <div class="dsec__grid">${pairs.map(([k, v]) =>
    `<div><div class="dfact__k">${k}</div><div class="dfact__v">${v == null || v === '' ? '—' : v}</div></div>`).join('')}
  </div></section>`;

function openDetail(p) {
  const win = $('#detailWin');
  $('#dCap').textContent = `dmc / ${KINDS[p.kind].toLowerCase()} / ${p.name.toLowerCase().replace(/\s+/g, '-')}`;
  const machine = p.kind === 'schema' || p.kind === 'kit';
  const priceText = p.price === 'Free' ? 'Free'
    : p.price === 'Maintenance' ? 'Included in maintenance' : '$' + fmt(p.priceVal);
  /* controller series/model split out of the control-model string */
  const cmodel = p.ctrlModel.replace(p.control + ' ', '');
  const cseries = cmodel.split(/[- ]/)[0];
  const updated = new Date(); updated.setDate(updated.getDate() - p.ts);
  const published = new Date(updated); published.setDate(published.getDate() - 90 - p.dl % 300);
  const waFull = p.wa ? ['X ' + p.wa.x, p.wa.y != null ? 'Y ' + p.wa.y : null, 'Z ' + p.wa.z]
    .filter(Boolean).join(' × ') + ' mm' : '—';
  /* posts for the same control family, closest type first */
  const recs = DATA.filter(x => x.kind === 'post' && x.id !== p.id && x.control === p.control)
    .sort((a, b) => (b.type === p.type) - (a.type === p.type) || b.dl - a.dl)
    .slice(0, 3);

  const samples = `
    ${p.kind !== 'schema' ? `<div class="dsamples"><div class="dsect__h">Samples</div>
      <div class="dsamples__row">
        <span class="dsample"><svg><use href="#k-interp"/></svg><span><b>G&amp;M Codes</b><i>Coming soon</i></span></span>
        ${p.kind !== 'interp' ? '<span class="dsample"><svg><use href="#k-post"/></svg><span><b>NC File</b><i>Coming soon</i></span></span>' : ''}
      </div></div>` : ''}`;

  $('#detailBody').innerHTML = `
    <div class="dhero"><div class="dhero__text">
      <div class="dhero__name">${esc(p.name)}
        <span class="kindtag kindtag--${p.kind}">${KINDS[p.kind]}</span>
        <button class="dstar${p.fav ? ' is-on' : ''}" id="dFav" title="Favorite">
          <svg><use href="#${p.fav ? 'i-star-fill' : 'i-star'}"/></svg></button></div>
      <div class="dhero__meta">
        <span>${esc(p.publisher)}</span><span class="dhero__sep"></span>
        <span class="dhero__dl"><svg><use href="#i-download"/></svg>${fmt(p.dl)} downloads</span>
        <span class="dhero__sep"></span><span>Updated ${fmtDate(updated)}</span>
      </div>
    </div></div>
    <div class="dbody">
      <div class="dmain">
        <div class="dgal__stage${p.photo ? '' : ' is-empty'}">${p.photo
          ? `<img src="${p.photo}" alt="">` : `<svg><use href="#${KGLYPH[p.kind]}"/></svg>`}</div>
        <div class="dblock"><div class="dblock__h">About</div>
          ${ABOUT[p.kind](p).map(t => `<p>${t}</p>`).join('')}</div>
        ${recs.length ? `<div class="drecs"><div class="dblock__h">Recommended post processors</div>
          ${recs.map(r => `<button class="drec" data-rec="${r.id}">
            <span class="klogo klogo--post">P</span>
            <span class="drec__text"><span class="drec__name">${esc(r.name)}</span>
              <span class="drec__sub">${esc(r.maker + ' ' + r.model)} · ${esc(r.type)}</span></span>
            <span class="drec__price">${priceHtml(r)}</span>
          </button>`).join('')}</div>` : ''}
        ${samples}
      </div>
      <aside class="dside">
        <div class="dact">
          <button class="btn-primary" id="dGet"><svg><use href="#i-download"/></svg>${
            p.got ? 'Added' : p.price === 'Paid' ? 'Buy · $' + fmt(p.priceVal) : 'Get'}</button>
          ${p.kind === 'kit' ? '' : `<button class="btn-secondary dside__req" data-req>${
            p.kind === 'schema' ? 'Request a post processor' : 'Request a machine schema'}</button>`}
        </div>
        <div class="dprice"><span class="dprice__k">Price</span>
          <span class="dprice__v${p.price === 'Maintenance' ? ' is-note' : ''}">${priceText}</span></div>
        ${fsec('Machine', [
          ['Manufacturer', esc(p.maker)], ['Machine type', esc(p.type)],
          ['Series', p.kind === 'interp' ? '—' : esc(p.series)],
          ['Model', p.kind === 'interp' ? '—' : esc(p.model)],
          ['Number of axes', p.axes >= 6 ? '6+' : p.axes],
          ...(machine ? [['Work area (X×Y×Z)', waFull]] : []),
          ...(machine && p.opts.length ? [['Equipment',
            p.opts.map(o => `<span class="xtag">${esc(o)}</span>`).join(' ')]] : []),
        ])}
        ${fsec('Controller', [
          ['Manufacturer', esc(p.control)], ['Series', esc(cseries)],
          ['Model', esc(cmodel)], ['Units', p.units],
        ])}
        ${fsec('Details', [
          ['ENCY ver', ['1','2','3'].slice(0, 1 + p.id % 3).join(', ')],
          ['Experience', 'Not tested'],
          ['Tested in ENCY', 'Not tested'],
        ])}
        ${fsec('Publisher', [
          ['Author', '—'], ['Company', esc(p.publisher)],
          ['Status', 'Published'], ['Downloads', fmt(p.dl)],
          ['Published', fmtDate(published)], ['Updated', fmtDate(updated)],
        ])}
      </aside>
    </div>`;

  $('#dGet').onclick = () => { p.got = !p.got;
    $('#dGet').innerHTML = `<svg><use href="#i-download"/></svg>${
      p.got ? 'Added' : p.price === 'Paid' ? 'Buy · $' + fmt(p.priceVal) : 'Get'}`;
    toast(p.got ? `${p.name} added to your workspace` : `${p.name} removed`); };
  const req = $('#detailBody [data-req]');
  if (req) req.onclick = () => toast('Request sent to the publisher');
  $('#dFav').onclick = () => { p.fav = !p.fav;
    $('#dFav').classList.toggle('is-on', p.fav);
    $('#dFav').innerHTML = `<svg><use href="#${p.fav ? 'i-star-fill' : 'i-star'}"/></svg>`;
    if (S.favOnly) renderCatalog();
    toast(p.fav ? 'Added to favorites' : 'Removed from favorites'); };
  $('#detailBody').querySelectorAll('[data-rec]').forEach(b =>
    b.addEventListener('click', () => openDetail(DATA.find(x => x.id == b.dataset.rec))));
  win.hidden = false;
}
$('#dClose').onclick = () => { $('#detailWin').hidden = true; };
$('#detailWin').addEventListener('click', e => { if (e.target === $('#detailWin')) $('#detailWin').hidden = true; });
$('#dCopy').onclick = () => toast('Link copied');
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#detailWin').hidden = true; });

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
/* favorites: a toggle next to the scope switch, as in the Store */
$('#favBtn').onclick = () => {
  S.favOnly = !S.favOnly;
  const b = $('#favBtn');
  b.classList.toggle('is-on', S.favOnly);
  $('svg use', b).setAttribute('href', S.favOnly ? '#i-star-fill' : '#i-star');
  update();
};
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
/* pressed = the panel is SHOWN, matching the view-mode buttons */
$('#funnelBtn').onclick = () => {
  S.sideHidden = !S.sideHidden;
  $('#side').hidden = S.sideHidden || S.page === 'account';
  $('#funnelBtn').classList.toggle('is-on', !S.sideHidden);
};
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
  if (b.dataset.uact === 'account') { openAccount('profile'); return; }
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

/* ------------------------------------------------------------ account ----- */
const ME = { user: 'ruslan.m', name: 'Ruslan Mardanshin', email: 'ruslan.m@encycam.io',
  company: 'ENCY Software Ltd', since: '14/03/2024' };
/* the account nav is two frames: my own things, then the moderation tools */
const ACCT_SECS = [
  ['', [
    ['profile', 'Profile', 'i-user'],
    ['dashboard', 'Dashboard', 'i-dash'],
    ['licenses', 'My licenses', 'i-check-circle'],
    ['published', 'My published', 'i-upload'],
    ['import', 'Bulk import', 'i-box'],
  ]],
  ['Admin', [
    ['requests', 'Requests', 'i-shield'],
    ['accepts', 'Accepts', 'i-check'],
    ['compreq', 'Component requests', 'i-mail'],
    ['publishers', 'Publishers', 'i-pubs'],
    ['users', 'Users', 'i-users'],
    ['activity', 'Activity log', 'i-clock'],
    ['analytics', 'Analytics', 'i-chart'],
  ]],
];
function openAccount(sec) { S.page = 'account'; S.acctSec = sec || 'profile'; update(); }
function closeAccount() { S.page = 'catalog'; update(); }
$('#backBtn').onclick = closeAccount;

function acctTable(rows, cols, empty) {
  if (!rows.length) return `<div class="empty" style="padding:32px 16px">
    <svg><use href="#i-search"/></svg><b>${empty}</b></div>`;
  return `<div class="acard acard--flush"><table class="mtable mtable--acct">
    <thead><tr>${cols.map(c => `<th class="${c[2] || ''}">${c[0]}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(p => `<tr data-id="${p.id}">${cols.map(c =>
      `<td class="${c[2] || ''}">${c[1](p)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}
const acctId = p => `<div class="mtable__id">
  <div class="mtable__idtext"><span class="mtable__name">${esc(p.name)}</span>
    <span class="mtable__sub">${esc(p.maker)} · ${esc(p.type)}</span></div></div>`;
const acctDate = p => { const d = new Date(); d.setDate(d.getDate() - p.ts); return fmtDate(d); };

/* mock license/publishing facts derived from the product record */
const licNo = p => 463000 + p.id;
const licType = p => p.price === 'Paid' ? 'Full' : 'Trial';
const licUntil = p => { const d = new Date();
  d.setDate(d.getDate() - p.ts + (licType(p) === 'Full' ? 365 : 30)); return d; };
const daysLeft = d => Math.max(0, Math.ceil((d - new Date()) / 86400000));
const PUB_STATUS = p => ['ok:Published', 'wait:Pending review', 'draft:Draft'][p.id % 3].split(':');
/* stacked bar list: each row splits into colored segments with a legend below */
const SEG = {
  pub: [['ok', 'Published', 'var(--ec-green)'], ['wait', 'Pending review', 'var(--ec-amber)'],
    ['draft', 'Draft', 'var(--ec-fg-32)']],
  kind: [['schema', 'Machine Schema', 'var(--ec-green)'], ['post', 'Post Processor', 'var(--ec-blue)'],
    ['interp', 'Interpreter', 'var(--op-violet)'], ['kit', 'Kit', 'var(--ec-amber)']],
  lic: [['active', 'Active', 'var(--ec-green)'], ['trial', 'Trial', 'var(--ec-blue)'],
    ['expiring', 'Expiring', 'var(--ec-amber)'], ['expired', 'Expired', 'var(--op-coral)']],
};
/* dashboard card state: active tab, Top N and range per card, publisher filter */
const DASH = { tabA: 'type', tabL: 'type', topA: 10, topU: 10, topL: 10,
  rangeA: 'all', rangeU: 'all', rangeL: 'all', maker: 'all' };
const RANGE_L = { all: 'All time', 90: 'Last 90 days', 30: 'Last 30 days' };
const dchip = (label, val, key) => `<button class="dchip" data-dmenu="${key}">
  ${label}: <b>${esc(String(val))}</b><svg><use href="#i-chevdown"/></svg></button>`;
const dchipStub = (label, val) => `<button class="dchip" data-stub>
  ${label}: <b>${esc(val)}</b><svg><use href="#i-chevdown"/></svg></button>`;
const dtabs = (key, tabs) => `<div class="dtabs">${tabs.map(([v, l]) =>
  `<button class="dtab${DASH[key] === v ? ' is-on' : ''}" data-dtab="${key}:${v}">${l}</button>`).join('')}</div>`;
function barCard(title, note, rows, segs, opts = {}) {
  const total = r => segs.reduce((a, [k]) => a + (r[2][k] || 0), 0);
  const max = Math.max(...rows.map(total), 1);
  const used = new Set();
  const body = rows.map(([label, sub, by]) => {
    const fill = segs.filter(([k]) => by[k]).map(([k, l, c]) => { used.add(k);
      return `<span class="bar__seg" data-tip="${esc(l)}: ${fmt(by[k])}"
        style="width:${by[k] / max * 100}%;background:${c}"></span>`; }).join('');
    return `<div class="bar">
      <span class="bar__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
      <span class="bar__track">${fill}</span>
      <span class="bar__n">${fmt(total([label, sub, by]))}</span></div>`;
  }).join('');
  const legend = segs.filter(([k]) => used.has(k)).map(([, l, c]) =>
    `<span class="legend__item"><i style="background:${c}"></i>${l}</span>`).join('');
  const empty = `<div class="empty" style="padding:24px 8px">
    <svg><use href="#i-search"/></svg><b>Nothing in this range</b></div>`;
  return `<div class="acard acard--chart"><div class="acard__head">
      <span class="acard__title">${title}</span><span class="panel__hspacer"></span>
      <span class="acct__caption">${note}</span>
      ${opts.chips || ''}${opts.top ? dchip('Top', DASH[opts.top], opts.top) : ''}</div>
    ${opts.ctl || ''}
    ${rows.length ? `<div class="bars${opts.dense ? ' bars--dense' : ''}">${body}</div>
      <div class="acard__legend">${legend}</div>` : empty}</div>`;
}
/* KPI tiles: value, label, and a delta line pinned to the bottom edge */
const kpiRow = items => `<div class="kpis">${items.map(([l, v, d, warn]) =>
  `<div class="acard kpi${warn ? ' kpi--warn' : ''}">
    <div class="kpi__v">${v}</div><div class="kpi__l">${l}</div>
    <div class="kpi__d">${d}</div></div>`).join('')}</div>`;
/* 12-month area chart; buckets[0] is the oldest month */
const monthLabel = i => { const d = new Date();
  d.setMonth(d.getMonth() - (11 - i)); return d.toLocaleString('en', { month: 'short' }); };
function trendCard(title, note, buck) {
  const W = 600, H = 110, P = 6, mx = Math.max(...buck, 1);
  const pts = buck.map((v, i) =>
    [P + i * (W - 2 * P) / (buck.length - 1), H - P - v / mx * (H - 2 * P - 14)]);
  return `<div class="acard acard--chart"><div class="acard__head">
      <span class="acard__title">${title}</span><span class="panel__hspacer"></span>
      <span class="acct__caption">${note}</span></div>
    <div class="trendwrap">
      <svg class="trend" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <polygon class="trend__area" points="${P},${H - P} ${pts.map(p => p.join(',')).join(' ')} ${W - P},${H - P}"/>
        <polyline class="trend__line" points="${pts.map(p => p.join(',')).join(' ')}"/>
      </svg>
      <div class="trend__dots">${pts.map(([x, y], i) =>
        `<i data-tip="${monthLabel(i)}: ${fmt(buck[i])}" style="left:${x / W * 100}%;top:${y / H * 100}%"></i>`).join('')}</div>
    </div>
    <div class="trend__x">${buck.map((v, i) => `<span>${monthLabel(i)}</span>`).join('')}</div></div>`;
}
/* month buckets over the last year, from the record's "days ago" field */
const byMonth = (list, val = () => 1) => {
  const b = Array(12).fill(0);
  list.forEach(p => { const m = Math.floor(p.ts / 30); if (m < 12) b[11 - m] += val(p); });
  return b;
};
/* one floating tooltip for all bar segments */
const barTip = el('div', 'bartip'); barTip.hidden = true;
document.body.appendChild(barTip);
document.addEventListener('mouseover', e => {
  const s = e.target.closest?.('[data-tip]');
  if (!s) { barTip.hidden = true; return; }
  barTip.textContent = s.dataset.tip; barTip.hidden = false;
  const r = s.getBoundingClientRect();
  barTip.style.left = Math.max(8 + barTip.offsetWidth / 2,
    Math.min(r.left + r.width / 2, innerWidth - barTip.offsetWidth / 2 - 8)) + 'px';
  barTip.style.top = (r.bottom + 6) + 'px';
});

/* --------------------------------------------------------------- admin ---- */
/* admin UI state: publishers tab, expanded teams, component-request tab,
   analytics range in days */
const ADM = { pubTab: 'teams', pubOpen: new Set(['CAMSUPS Co., Ltd.']), crTab: 'new', range: 30 };
const atabs = (key, tabs) => `<div class="dtabs">${tabs.map(([v, l, n]) =>
  `<button class="dtab${String(ADM[key]) === String(v) ? ' is-on' : ''}" data-atab="${key}:${v}">
    ${l}${n != null ? `<span class="dtab__n">${n}</span>` : ''}</button>`).join('')}</div>`;

/* dealer teams: [name, isPublisher, members [email, person, isPrimary]] */
const TEAMS = [
  ['ENCY Software Ltd', 1, Array.from({ length: 29 }, (_, i) =>
    [`user${i + 1}@encycam.io`, '', i === 0])],
  ['PMS Tooling', 1, [['sudhakar@pmstooling.com', 'Mr J. Sudhakar', 0]]],
  ['Robotic Solutions Inc.', 1, [['corey@roboticsolutionsinc.com', 'Corey Drake', 1]]],
  ['Global Robots Limited', 0, []],
  ['Suzhou Layway Intelligent Manufacturing Co., Ltd', 0, []],
  ['Alibre France', 0, []],
  ['SPS Softtech Solutions', 0, []],
  ['Triovibe Solutions Private Limited', 0, []],
  ['Shanghai Qianghu Information Technology Co., Ltd', 1, [['aterf_yu@qianghu.com', 'Aterf Yu', 1]]],
  ['BERMAQ.com', 0, []],
  ['CAMSUPS Co., Ltd.', 1, [
    ['iwaki@camsups.co.jp', 'Shinya Iwaki', 0], ['katayama@camsups.co.jp', 'Shun Katayama', 0],
    ['meguro@camsups.co.jp', 'Meguro Rinta', 0], ['shimura@camsups.co.jp', 'Gozo Shimura', 1]]],
  ['Reliable Solutions', 0, []],
  ['S&J Automations', 0, []],
  ['Polymeta C Ltd.', 0, []],
  ['Techsoft Services', 0, []],
  ['Smard Tech.', 0, []],
  ['Softwarecadcam S.A. de C.V.', 1, [
    ['ana@softwarecadcam.mx', 'Ana Reyes', 1], ['luis@softwarecadcam.mx', 'Luis Ortega', 0]]],
];
/* dealer space import: [company, country, contacts, hasAccess] */
const DEALERS = [
  ['Global Robots Limited', 'United Kingdom', 0, 0], ['PMS Tooling', 'India', 1, 1],
  ['Robotic Solutions Inc.', 'United States of America', 3, 1],
  ['Suzhou Layway Intelligent Manufacturing Co., Ltd', 'China', 4, 0],
  ['Alibre France', 'France', 4, 0], ['SPS Softtech Solutions', 'India', 2, 0],
  ['Triovibe Solutions Private Limited', 'India', 1, 0],
  ['Shanghai Qianghu Information Technology Co., Ltd', 'China', 1, 1],
  ['BERMAQ.com', 'Spain', 4, 0], ['CAMSUPS Co., Ltd.', 'Japan', 9, 1],
  ['Reliable Solutions', 'India', 2, 0],
];
const ACCESS_REQ = [
  ['Gerry Grainger', 'gerry.grainger@encycam.com', 'gerry.grainger@encycam.com',
    'ENCY SOFTWARE LTD', '13/08/2026'],
  ['Andreas Reitz', 'reitz@cnc-technik.de', 'andreas',
    'I want to add our robot and machines', '09/07/2026'],
  ['Javier Jaramillo', 'javierj@encycam.mx', 'javierj',
    'Hello everyone, i need access to upload my schemas, thanks!', '28/05/2026'],
];
/* users registry: [id, name, company, dmcLicenses, encyLicenses] */
const ADM_USERS = [
  ['e1cbb429-5228-4f4b-aee2-ad26ffd4fa0b', '!YV !YV', 'ENCY Software Ltd', 1, 0],
  ['04cdc660-428e-4f7c-b2e4-5e234eff1dc8', 'Evgeniy Ivakhnik', 'ENCY Software Ltd', 1, 0],
  ['dbe79622-56dc-4532-9a3c-9e23a4bc24f2', 'Grzegorz Oleszek', 'Premium Solutions Polska Sp. z o.o.', 2, 0],
  ['9b23b524-b9db-4f70-8069-d8c67a568268', 'ilya_cl', 'test LM', 1, 1],
  ['5ec67609-30eb-4eaa-9eed-8b9f108591c2', 'Lenar Galiullin', '', 7, 7],
  ['21e61c19-1e1b-44ef-8685-782e939590ba', 'Lenar Galiullin', '', 26, 26],
  ['9de3c041-ff58-48f6-87d7-2174c41b0b93', 'Marcin Wasilewski', 'Premium Solutions Polska Sp. z o.o.', 8, 0],
  ['5d38f97e-aec7-4ab8-86e2-e2f1acd03818', 'Vladimir Emelianenko', 'ENCY Software Ltd', 8, 0],
  ['6b9d864a-7a80-489d-afa7-a33b2593888c', 'Yuriy Vishnevsky', 'ENCY Software Ltd', 1, 0],
  ['76c6e708-7b07-41c0-b32a-fc358e896b47', 'yvuser', 'yvuser', 19, 13],
];
/* audit trail: [when, actor, action, summary, mono detail, highlight] */
const ACTIVITY = [
  ['2026-08-21 12:00:38', 'ruslan.m', 'Profiles synced from Keycloak',
    'Profile sync skipped — Keycloak Admin API unavailable',
    'total=89 adminApiError=401 Unauthorized on POST …/openid-connect/token: [no body]', ''],
  ['2026-08-21 11:57:40', 'hazrat', 'Profiles synced from Keycloak',
    'Profile sync skipped — Keycloak Admin API unavailable',
    'total=89 adminApiError=401 Unauthorized on POST …/openid-connect/token: [no body]', ''],
  ['2026-08-21 11:49:26', 'yv@encycam.com', 'Product updated',
    'Updated product "Tormach 15L Slant-Pro"', 'productId=5426d050-d4bd-4f5c-aee8-d72424efd77f', ''],
  ['2026-08-21 11:48:58', 'yv@encycam.com', 'Product updated',
    'Updated product "Tormach 15L Slant-Pro"', 'productId=5426d050-d4bd-4f5c-aee8-d72424efd77f', ''],
  ['2026-08-21 11:34:29', 'yv@encycam.com', 'Product updated',
    'Updated product "Tormach 15L Slant-Pro"', 'productId=5426d050-d4bd-4f5c-aee8-d72424efd77f', ''],
  ['2026-08-21 11:29:02', 'r.latipov@encycam.com', 'Profiles synced from Keycloak',
    'Profile sync skipped — Keycloak Admin API unavailable',
    'total=88 adminApiError=401 Unauthorized on POST …/openid-connect/token: [no body]', ''],
  ['2026-08-20 14:30:38', 'yv@encycam.com', 'Product updated',
    'Updated product "Hwacheon Vesta 1000 - Fanuc 0i-MD"', 'productId=2fc1e983-de48-450e-97bf-47b56e0f1b5b', ''],
  ['2026-08-20 14:25:26', 'yv@encycam.com', 'Product link added',
    'Added 1 MADE_FOR link(s)', 'productId=38767605-17a2-44d2-87d8-d744f29f376d type=MADE_FOR', ''],
  ['2026-08-20 14:20:59', 'yv@encycam.com', 'Product status changed',
    'Changed status of "Hwacheon Vesta 1000 - Fanuc 0i-MD": PENDING_REVIEW → PUBLISHED',
    'from=PENDING_REVIEW to=PUBLISHED', 'warn'],
  ['2026-08-20 14:20:06', 'yv@encycam.com', 'Product created',
    'Created product "Hwacheon Vesta 1000 - Fanuc 0i-MD"', 'status=PENDING_REVIEW', 'new'],
  ['2026-08-20 12:02:42', 'yv@encycam.com', 'Product link added',
    'Added 1 SUITABLE link(s)', 'productId=03921a5f-1972-4ac3-a2e1-5e32e039ee43 type=SUITABLE', ''],
  ['2026-08-20 12:02:41', 'yv@encycam.com', 'Product updated',
    'Updated product "Hwacheon VESTA-1000"', 'productId=03921a5f-1972-4ac3-a2e1-5e32e039ee43', ''],
];
/* analytics: 90 seeded days of visits / license activations, newest last */
const AN_DAYS = Array.from({ length: 90 }, () => {
  const quiet = rnd() < .35;
  return {
    in: quiet ? 0 : ri(0, 8), anon: quiet ? (rnd() < .5 ? ri(0, 2) : 0) : ri(0, 5),
    schema: rnd() < .1 ? ri(1, 3) : 0, post: rnd() < .14 ? ri(1, 9) : 0,
    interp: rnd() < .04 ? 1 : 0, kit: rnd() < .04 ? ri(1, 2) : 0,
  };
});
const AN_COUNTRIES = [['NL', 103], ['LV', 42], ['RU', 38], ['CY', 33], ['BE', 11],
  ['US', 10], ['MX', 5], ['DE', 3], ['TR', 3], ['PL', 2]];
const AN_COMP = [
  ['DMG MORI CLX 350', 'schema', 8, 0, 1, 2], ['Fanuc 30i M', 'post', 7, 0, 0, 0],
  ['Fanuc 31i B Plus', 'post', 7, 0, 0, 0], ['Tormach PCNC', 'schema', 7, 0, 1, 1],
  ['Sinumerik 840D', 'post', 6, 0, 0, 0], ['Tormach 15L Slant-Pro', 'schema', 6, 0, 0, 0],
  ['Fanuc 0i-MF Plus', 'post', 5, 1, 0, 0], ['Fanuc 31i A', 'post', 5, 0, 0, 0],
];
/* daily column chart: one stacked column per day, shared bar tooltip */
function colChart(title, note, days, segs) {
  const max = Math.max(...days.map(d => segs.reduce((a, [k]) => a + (d[k] || 0), 0)), 1);
  const cols = days.map((d, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (days.length - 1 - i));
    const fill = segs.filter(([k]) => d[k]).map(([k, l, c]) =>
      `<i data-tip="${fmtDate(dt)} — ${l}: ${d[k]}"
        style="height:${d[k] / max * 100}%;background:${c}"></i>`).join('');
    return `<span class="col">${fill}</span>`; }).join('');
  const first = new Date(); first.setDate(first.getDate() - (days.length - 1));
  const legend = segs.map(([, l, c]) =>
    `<span class="legend__item"><i style="background:${c}"></i>${l}</span>`).join('');
  return `<div class="acard acard--chart"><div class="acard__head">
      <span class="acard__title">${title}</span><span class="panel__hspacer"></span>
      <span class="acct__caption">${note}</span></div>
    <div class="cols">${cols}</div>
    <div class="trend__x"><span>${fmtDate(first)}</span><span>${fmtDate(new Date())}</span></div>
    <div class="acard__legend">${legend}</div></div>`;
}
const actionsBtn = p => `<button class="dchip dchip--act" data-actm="${p.id}">
  Actions<svg><use href="#i-chevdown"/></svg></button>`;

function renderAccount() {
  const body = $('#storeBody');
  $('#storeTitle').textContent = 'Account';
  $('#storeCnt').textContent = '';
  let inner = '';
  if (S.acctSec === 'profile') {
    inner = `<div class="acct__h1">Profile</div>
      <div class="acard acct__prof">
        <div class="acct__factgrid">
          <div><div class="fact__label">Full name</div><div class="fact__value">${ME.name}</div></div>
          <div><div class="fact__label">Username</div><div class="fact__value">${ME.user}</div></div>
          <div><div class="fact__label">Email</div><div class="fact__value">${ME.email}</div></div>
          <div><div class="fact__label">Company</div><div class="fact__value">${ME.company}</div></div>
          <div><div class="fact__label">Roles</div><div class="fact__value">
            <span class="roletag">Customer</span><span class="roletag">Publisher</span>
            <span class="roletag is-admin">Admin</span></div></div>
        </div>
        <div class="acct__proffoot">
          <button class="btn-quiet is-danger" id="acctLogout"><svg><use href="#i-logout"/></svg>Log out</button>
        </div>
      </div>`;
  } else if (S.acctSec === 'dashboard') {
    const kinds = ['schema','post','interp','kit'];
    const tally = (list, keyOf) => list.reduce((by, p) =>
      (by[keyOf(p)] = (by[keyOf(p)] || 0) + 1, by), {});
    const sum = by => Object.values(by).reduce((a, n) => a + n, 0);
    const desc = rows => rows.sort((a, b) => sum(b[2]) - sum(a[2]));
    const inRange = key => p => DASH[key] === 'all' || p.ts <= +DASH[key];
    const pubOf = p => PUB_STATUS(p)[0];
    const licStat = p => { const n = daysLeft(licUntil(p));
      return n === 0 ? 'expired' : n <= 14 ? 'expiring'
        : licType(p) === 'Trial' ? 'trial' : 'active'; };
    /* card 1 — assets I publish, by type / publisher / popularity */
    const DA = DATA.filter(inRange('rangeA'))
      .filter(p => DASH.maker === 'all' || p.maker === DASH.maker);
    let aRows, aSegs = SEG.pub;
    if (DASH.tabA === 'maker') {
      aRows = desc([...new Set(DA.map(p => p.maker))].map(m =>
        [m, '', tally(DA.filter(p => p.maker === m), pubOf)]));
    } else if (DASH.tabA === 'pop') {
      aSegs = SEG.kind;
      aRows = desc(DA.map(p => [p.name, p.maker, { [p.kind]: p.dl }]));
    } else {
      aRows = kinds.map(k => [KINDS[k], '', tally(DA.filter(p => p.kind === k), pubOf)]);
    }
    aRows = aRows.slice(0, DASH.topA);
    const aCtl = dtabs('tabA', [['type','Type'],['maker','Publisher'],['pop','Popularity']]);
    const aChips = dchip('Range', RANGE_L[DASH.rangeA], 'rangeA')
      + (DASH.tabA !== 'maker' ? dchip('Publisher', DASH.maker === 'all' ? 'All' : DASH.maker, 'maker') : '');
    /* card 2 — who holds licenses on my assets (mock roster, scaled by range) */
    const uf = { all: 1, 90: .6, 30: .3 }[DASH.rangeU];
    const roster = [
      ['Lenar Galiullin', '', { schema: 14, post: 8, kit: 3 }],
      ['yvuser', 'yvuser', { schema: 7, post: 6, interp: 4, kit: 2 }],
      ['Vladimir Emelianenko', 'ENCY Software Ltd', { post: 8 }],
      ['Marcin Wasilewski', 'Premium Solutions Polska', { schema: 5, post: 3 }],
      ['Grzegorz Oleszek', 'Premium Solutions Polska', { post: 2 }],
      ['Yuriy Vishnevsky', 'ENCY Software Ltd', { schema: 1 }]];
    const users = desc(roster.map(([n, s, by]) => [n, s,
      Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round(v * uf)])
        .filter(([, v]) => v > 0))]).filter(r => sum(r[2]) > 0)).slice(0, DASH.topU);
    const userTotal = users.reduce((a, u) => a + sum(u[2]), 0);
    const uChips = dchip('Range', RANGE_L[DASH.rangeU], 'rangeU');
    /* card 3 — licenses on my assets, by type / asset / popularity */
    const DL = DATA.filter(p => p.got).filter(inRange('rangeL'));
    let lRows, lSegs = SEG.lic;
    if (DASH.tabL === 'asset') {
      lRows = desc(DL.map(p => [p.name, p.maker, { [licStat(p)]: 1 }]));
    } else if (DASH.tabL === 'pop') {
      lSegs = SEG.kind;
      lRows = desc(DL.map(p => [p.name, p.maker, { [p.kind]: p.dl }]));
    } else {
      lRows = kinds.map(k => [KINDS[k], '', tally(DL.filter(p => p.kind === k), licStat)]);
    }
    lRows = lRows.slice(0, DASH.topL);
    const lCtl = dtabs('tabL', [['type','Type'],['asset','Asset'],['pop','Popularity']]);
    const lChips = dchip('Range', RANGE_L[DASH.rangeL], 'rangeL');
    /* KPI row: the "is everything OK?" summary before any chart */
    const got = DATA.filter(p => p.got);
    const pubd = DATA.filter(p => pubOf(p) === 'ok').length;
    const kpis = kpiRow([
      ['Assets', fmt(DATA.length), `+${DATA.filter(p => p.ts <= 30).length} in 30d`],
      ['Published', fmt(pubd), `${Math.round(pubd / DATA.length * 100)}% of all`],
      ['Active licenses', fmt(got.filter(p => licStat(p) === 'active').length),
        `+${got.filter(p => p.ts <= 30).length} in 30d`],
      ['Expiring in 14d', fmt(got.filter(p => licStat(p) === 'expiring').length),
        'renewal needed', got.some(p => licStat(p) === 'expiring')],
      ['Downloads', fmt(DATA.reduce((a, p) => a + p.dl, 0)),
        `+${fmt(DATA.filter(p => p.ts <= 30).reduce((a, p) => a + p.dl, 0))} in 30d`],
    ]);
    const trend = trendCard('License activity',
      'new licenses per month · last 12 months', byMonth(got));
    inner = `<div class="acct__h1">Dashboard</div>
      ${kpis}
      <div class="acct__grid">
        <div class="acct__col">
          ${barCard('Asset distribution', fmt(DA.length) + ' assets', aRows, aSegs,
            { top: 'topA', ctl: aCtl, chips: aChips, dense: DASH.tabA === 'pop' })}
          ${barCard('Licenses on my assets', fmt(DL.length) + ' licenses', lRows, lSegs,
            { top: 'topL', ctl: lCtl, chips: lChips, dense: DASH.tabL !== 'type' })}
        </div>
        ${barCard('Users of my assets', userTotal + ' licenses · ' + users.length + ' users',
          users, SEG.kind, { top: 'topU', chips: uChips, ctl: '<div class="dtabs"></div>' })}
      </div>
      ${trend}`;
  } else if (S.acctSec === 'licenses') {
    const rows = DATA.filter(p => p.got);
    inner = `<div class="acct__h1">My licenses<span class="acct__h1n">${rows.length}</span></div>`
      + acctTable(rows, [
        ['License #', p => `<span class="licno"><i class="licdot"></i>${licNo(p)}</span>`],
        ['Name', acctId],
        ['License type', p => `<span class="statetag ${licType(p) === 'Full' ? 'is-ok' : 'is-wait'}">${licType(p)}</span>`],
        ['Created', acctDate, 'num'],
        ['Valid until', p => { const d = licUntil(p), n = daysLeft(d);
          return `<span class="${n <= 5 ? 'lic-soon' : ''}">${fmtDate(d)}</span>
            <small class="lic-left">${n}d left</small>`; }, 'num'],
        ['', () => '<span class="acticon" title="Open"><svg><use href="#i-ext"/></svg></span>', 'num'],
      ], 'No licenses yet — Get a product in the catalog');
  } else if (S.acctSec === 'published') {
    const rows = DATA.filter(p => p.mine);
    inner = `<div class="acct__h1">My published<span class="acct__h1n">${rows.length}</span></div>`
      + acctTable(rows, [
        ['Product', acctId], ['Category', p => `<span class="kindtag kindtag--${p.kind}">${KINDS[p.kind]}</span>`],
        ['Status', p => { const [t, l] = PUB_STATUS(p);
          return `<span class="statetag is-${t}">${l}</span>`; }],
        ['Licenses', p => fmt(p.dl % 40), 'num'],
        ['Downloads', p => fmt(p.dl), 'num'], ['Updated', acctDate, 'num'],
        ['Price', p => priceHtml(p), 'num'],
      ], 'Nothing published yet');
  } else if (S.acctSec === 'import') {
    inner = `<div class="acct__h1">Bulk import from ZIP</div>
      <p class="acct__lead">Drop one or more archives — each top-level folder or zip becomes
        a draft product, and auto-fill completes the missing fields.</p>
      <div class="acct__grid acct__grid--aside">
        <div class="acct__col">
          <div class="acard"><div class="acard__head">
              <span class="acard__title">Detection rules</span></div>
            <div class="rules">
              <span class="rule"><code>xml + osd</code>Machine Schema</span>
              <span class="rule"><code>dll / sppx</code>Post Processor</span>
              <span class="rule"><code>stncl</code>Interpreter</span>
              <span class="rule"><code>mix of the above</code>Digital Machine Kit</span>
              <span class="rule"><code>none</code>ignored</span>
            </div></div>
          <div class="acard"><div class="acard__head">
              <span class="acard__title">Naming legend</span></div>
            <p class="acct__hinttext">Paste your archive-naming convention so each component gets a
              human-readable title. Leave empty to keep the raw archive name.</p>
            <textarea class="field fieldarea" placeholder="Example: M3X = 3-axis mill, M5X = 5-axis mill, L2X = 2-axis lathe, MT = mill-turn, EDM = wire EDM. Then brand-series-model (e.g. Hurco-VMX-64Ti)."></textarea>
          </div>
          <div class="acard"><div class="acard__head">
              <span class="acard__title">Auto-fill</span></div>
            <div id="aiRows">
              <button class="frow is-on" data-ai><span class="frow__check"><svg><use href="#i-check-b"/></svg></span>
                <span>Generate cover image<small>Image of the machine on a clean background</small></span></button>
              <button class="frow is-on" data-ai><span class="frow__check"><svg><use href="#i-check-b"/></svg></span>
                <span>Generate description<small>Writes a 2–4 sentence product description</small></span></button>
              <button class="frow is-on" data-ai><span class="frow__check"><svg><use href="#i-check-b"/></svg></span>
                <span>Generate metadata<small>Machine type, axis count, controller, OEM, series, model</small></span></button>
            </div>
          </div>
        </div>
        <div class="acct__col acct__col--fill">
          <div class="acard acard--drop">
            <svg class="drop__icon"><use href="#i-box"/></svg>
            <b>Drop one or more .zip archives here</b>
            <span>Max 1024 MB per archive</span>
            <button class="btn-secondary" data-stub>Select ZIP(s)</button>
          </div>
          <div class="acard"><div class="acard__head">
              <span class="acard__title">Imports</span><span class="panel__hspacer"></span>
              <span class="acct__caption">0</span></div>
            <div class="empty"><svg><use href="#i-box"/></svg>
              <b>No imports yet</b><span>Drop archives above to begin</span></div>
          </div>
        </div>
      </div>`;
  } else if (S.acctSec === 'requests' || S.acctSec === 'accepts') {
    /* moderation queue and the published registry share one table shape */
    const req = S.acctSec === 'requests';
    const rows = DATA.filter(p => PUB_STATUS(p)[0] === (req ? 'wait' : 'ok'));
    const shown = rows.slice(0, 30);
    inner = `<div class="acct__h1">${req ? 'Requests' : 'Accepts'}<span class="acct__h1n">${rows.length}</span></div>
      <p class="acct__lead">${req
        ? 'Submissions waiting for review. Accept publishes the asset, Reject returns it to the publisher.'
        : 'Everything that passed review and is live in the catalog. Revoke pulls an asset back to review.'}</p>`
      + acctTable(shown, [
        [req ? 'Submission' : 'Product', acctId],
        ['Category', p => `<span class="kindtag kindtag--${p.kind}">${KINDS[p.kind]}</span>`],
        ['Publisher', p => esc(p.publisher)],
        ['Control', p => esc(p.control)],
        ['Axes', p => p.axes, 'num'],
        [req ? 'Submitted' : 'Published', acctDate, 'num'],
        ['Status', () => `<span class="statetag ${req ? 'is-wait' : 'is-ok'}">${req ? 'Pending review' : 'Published'}</span>`],
        ['', actionsBtn, 'num'],
      ], req ? 'Review queue is empty' : 'Nothing published yet')
      + (rows.length > shown.length
        ? `<div class="acct__more">Showing ${shown.length} of ${fmt(rows.length)}</div>` : '');
  } else if (S.acctSec === 'compreq') {
    const tabs = [['new', 'New', 0], ['prog', 'In progress', 0], ['done', 'Done', 0],
      ['rej', 'Rejected', 0], ['all', 'All', 0]];
    inner = `<div class="acct__h1">Component requests</div>
      <p class="acct__lead">Users ask here for posts, schemas and interpreters that are missing
        from the catalog.</p>
      ${atabs('crTab', tabs)}
      <div class="acard"><div class="empty" style="padding:32px 8px">
        <svg><use href="#i-mail"/></svg><b>No requests yet</b>
        <span>Requests from the catalog and from product cards will appear here</span></div></div>`;
  } else if (S.acctSec === 'publishers') {
    const users = TEAMS.reduce((a, t) => a + t[2].length, 0);
    let tab = '';
    if (ADM.pubTab === 'teams') {
      tab = `<div class="acard acard--flush">${TEAMS.map(([name, pub, mem]) => {
        const open = ADM.pubOpen.has(name);
        return `<div class="trow${open ? ' is-open' : ''}${mem.length ? '' : ' no-kids'}" data-team="${esc(name)}">
            <svg class="trow__chev"><use href="#i-chevdown"/></svg>
            <span class="trow__name">${esc(name)}</span><span class="panel__hspacer"></span>
            ${pub ? '<span class="statetag is-ok">Publisher</span>' : ''}
            <span class="trow__n"><svg><use href="#i-users"/></svg>${mem.length}</span></div>`
          + (open ? mem.slice(0, 8).map(([mail, person, prim]) =>
            `<div class="tmember"><span class="tmember__mail">${esc(mail)}</span>
              ${person ? `<span class="tmember__name">— ${esc(person)}</span>` : ''}
              ${prim ? '<span class="statetag is-info">Primary</span>' : ''}
              <span class="panel__hspacer"></span>
              <span class="roletag">Customer</span><span class="statetag is-ok">active</span></div>`).join('')
            + (mem.length > 8 ? `<div class="tmember tmember--more">… and ${mem.length - 8} more</div>` : '')
          : ''); }).join('')}</div>`;
    } else if (ADM.pubTab === 'ds') {
      tab = `<div class="acard"><div class="acard__head">
          <span class="acard__title">Dealer import settings</span></div>
        <div class="fact__label">Default dealer team role</div>
        <div class="acct__ctlrow">${dchipStub('Role', 'Publisher')}
          <button class="btn-secondary" data-stub>Save</button></div>
        <p class="acct__hinttext">Role automatically assigned to new dealer teams on import.</p></div>
        <div class="acard acard--flush"><div class="acard__head acard__head--pad">
          <span class="acard__title">Import dealers from Dealer Space</span>
          <span class="panel__hspacer"></span>
          <span class="acct__caption">${DEALERS.length} dealers found</span>
          ${dchipStub('Country', 'All')}${dchipStub('Show', 'Enabled only')}
          <button class="btn-secondary" data-stub>Fetch from DS</button></div>
        <table class="mtable mtable--acct"><thead><tr>
          <th>Company</th><th>Country</th><th class="num">Contacts</th><th>Status</th><th class="num"></th>
        </tr></thead><tbody>${DEALERS.map(([c, co, n, acc]) => `<tr>
          <td><span class="mtable__name">${esc(c)}</span></td><td>${esc(co)}</td>
          <td class="num">${n}</td>
          <td><span class="statetag ${acc ? 'is-ok' : 'is-draft'}">${acc ? 'Active' : 'No access'}</span></td>
          <td class="num"><button class="btn-quiet" data-stub>Manage</button></td></tr>`).join('')}
        </tbody></table></div>`;
    } else {
      tab = `<p class="acct__lead">Dealers who have requested access. Import them via DS import
          or create manually, then dismiss the request.</p>
        <div class="acard acard--flush"><table class="mtable mtable--acct"><thead><tr>
          <th>Name</th><th>Email</th><th>Username</th><th>Note</th><th class="num">Date</th><th class="num"></th>
        </tr></thead><tbody>${ACCESS_REQ.map(([n, e, u, note, d]) => `<tr>
          <td><span class="mtable__name">${esc(n)}</span></td><td>${esc(e)}</td><td>${esc(u)}</td>
          <td class="c-note">${esc(note)}</td><td class="num">${d}</td>
          <td class="num"><button class="btn-quiet is-danger" data-stub>Dismiss</button></td></tr>`).join('')}
        </tbody></table></div>`;
    }
    inner = `<div class="acct__h1">Publishers</div>
      <p class="acct__lead">Manage dealer teams, roles and employee access ·
        ${TEAMS.length} teams, ${users} users</p>
      ${atabs('pubTab', [['teams', 'Teams & roles'], ['ds', 'DS import'],
        ['access', 'Access requests', ACCESS_REQ.length]])}
      ${tab}`;
  } else if (S.acctSec === 'users') {
    inner = `<div class="acct__h1">Users<span class="acct__h1n">${ADM_USERS.length}</span></div>
      <div class="acard acard--flush"><table class="mtable mtable--acct"><thead><tr>
        <th>User ID</th><th>User name</th><th>Company</th>
        <th class="num">DMC licenses</th><th class="num">ENCY licenses</th>
      </tr></thead><tbody>${ADM_USERS.map(([id, n, c, dmc, ency]) => `<tr>
        <td><span class="uid">${id}</span></td>
        <td><span class="mtable__name">${esc(n)}</span></td><td>${esc(c) || '—'}</td>
        <td class="num"><b class="licn">${dmc}</b></td>
        <td class="num"><b class="licn licn--ency">${ency}</b></td></tr>`).join('')}
      </tbody></table></div>`;
  } else if (S.acctSec === 'activity') {
    inner = `<div class="acct__h1">Activity log</div>
      <div class="acct__ctlrow">${dchipStub('Actions', 'All')}${dchipStub('Roles', 'All')}
        ${dchipStub('Users', 'All')}${dchipStub('Time', 'All')}</div>
      <div class="acard acard--flush"><table class="mtable mtable--acct mtable--log"><thead><tr>
        <th>When</th><th>Actor</th><th>Role</th><th>Action</th><th>Summary</th>
      </tr></thead><tbody>${ACTIVITY.map(([w, a, act, sum, sub, hi]) => `<tr>
        <td><span class="uid">${w}</span></td>
        <td><span class="mtable__name">${esc(a)}</span></td>
        <td><span class="roletag is-admin">Admin</span></td>
        <td><span class="${hi === 'warn' ? 'act-hi' : hi === 'new' ? 'act-new' : ''}">${esc(act)}</span></td>
        <td>${esc(sum)}<span class="act__sub">${esc(sub)}</span></td></tr>`).join('')}
      </tbody></table></div>`;
  } else if (S.acctSec === 'analytics') {
    const f = { 7: .3, 30: 1, 90: 1.85 }[ADM.range];
    const sc = n => fmt(Math.max(1, Math.round(n * f)));
    const days = AN_DAYS.slice(90 - ADM.range);
    const kpis = kpiRow([
      ['Visits', sc(229), `last ${ADM.range} days`],
      ['Unique visitors', sc(41), `last ${ADM.range} days`],
      ['Page views', sc(1566), `last ${ADM.range} days`],
      ['Trial licenses', sc(38), 'issued in range'],
      ['Permanent licenses', sc(7), 'issued in range'],
    ]);
    const actTotal = days.reduce((a, d) => a + d.schema + d.post + d.interp + d.kit, 0);
    const visTotal = days.reduce((a, d) => a + d.in + d.anon, 0);
    inner = `<div class="acct__h1">Analytics</div>
      ${atabs('range', [[7, '7 days'], [30, '30 days'], [90, '90 days']])}
      ${kpis}
      <div class="acct__grid">
        ${colChart('Visits per day', fmt(visTotal) + ' visits', days,
          [['in', 'Signed in', 'var(--ec-blue-soft)'], ['anon', 'Anonymous', 'var(--ec-fg-32)']])}
        ${colChart('Activations per day', fmt(actTotal) + ' licenses issued', days, SEG.kind)}
      </div>
      <div class="acct__grid">
        ${barCard('Visits by country', 'resolved from the visitor’s IP',
          AN_COUNTRIES.map(([c, n]) => [c, '', { v: Math.max(1, Math.round(n * f)) }]),
          [['v', 'Visits', 'var(--ec-blue-soft)']], { dense: 1 })}
        <div class="acct__col">
          <div class="acard acard--flush"><div class="acard__head acard__head--pad">
            <span class="acard__title">Activations by dealer</span><span class="panel__hspacer"></span>
            <span class="acct__caption">2 dealers</span></div>
          <table class="mtable mtable--acct"><thead><tr>
            <th>Dealer</th><th>Country</th><th class="num">Trial</th><th class="num">Permanent</th>
          </tr></thead><tbody>
            <tr><td><span class="mtable__name">Unattributed</span></td><td>—</td>
              <td class="num">${sc(27)}</td><td class="num">0</td></tr>
            <tr><td><span class="mtable__name">SprutCAM Tech ltd</span></td><td>—</td>
              <td class="num">${sc(11)}</td><td class="num">${sc(7)}</td></tr>
          </tbody></table></div>
          ${barCard('Views by type', 'over the selected range',
            [['Post Processor', '', { post: Math.round(153 * f) }],
             ['Machine Schema', '', { schema: Math.round(67 * f) }],
             ['Interpreter', '', { interp: Math.round(9 * f) }],
             ['Kit', '', { kit: Math.round(4 * f) }]], SEG.kind, { dense: 1 })}
        </div>
      </div>
      <div class="acard acard--flush"><div class="acard__head acard__head--pad">
        <span class="acard__title">Components</span><span class="panel__hspacer"></span>
        <span class="acct__caption">views and activations over the range · top ${AN_COMP.length} of 133</span>
        <button class="btn-quiet" data-stub>Show all 133</button></div>
      <table class="mtable mtable--acct"><thead><tr>
        <th>Component</th><th class="num">Views</th><th class="num">Trial / perm</th><th class="num">Downloads</th>
      </tr></thead><tbody>${AN_COMP.map(([n, k, v, t, pm, dl]) => `<tr>
        <td><span class="compdot" style="background:${SEG.kind.find(s => s[0] === k)[2]}"></span>
          <span class="mtable__name">${esc(n)}</span></td>
        <td class="num">${Math.round(v * f)}</td><td class="num">${t} / ${pm}</td>
        <td class="num">${dl}</td></tr>`).join('')}
      </tbody></table></div>`;
  }
  body.innerHTML = `<div class="acct">
    <nav class="acct__nav">${ACCT_SECS.map(([group, secs]) =>
      `<div class="anav__frame">${group ? `<div class="anav__cap">${group}</div>` : ''}
        ${secs.map(([k, l, ic]) =>
          `<button class="anav${S.acctSec === k ? ' is-on' : ''}" data-asec="${k}">
            <svg><use href="#${ic}"/></svg>${l}</button>`).join('')}</div>`).join('')}</nav>
    <div class="acct__main">${inner}</div>
  </div>`;
  body.querySelectorAll('[data-asec]').forEach(b =>
    b.addEventListener('click', () => { S.acctSec = b.dataset.asec; update(); }));
  /* dashboard controls: tabs switch grouping, chips open pick-menus */
  body.querySelectorAll('[data-dtab]').forEach(b =>
    b.addEventListener('click', () => {
      const [k, v] = b.dataset.dtab.split(':'); DASH[k] = v; renderAccount(); }));
  const MAKERS = [...new Set(DATA.map(p => p.maker))].sort();
  const dmenuOpts = key =>
    key.startsWith('top') ? [[5, 'Top 5'], [10, 'Top 10'], [20, 'Top 20']]
    : key.startsWith('range') ? [['all', RANGE_L.all], ['90', RANGE_L[90]], ['30', RANGE_L[30]]]
    : [['all', 'All'], ...MAKERS.map(m => [m, m])];
  body.querySelectorAll('[data-dmenu]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation();
      const key = b.dataset.dmenu;
      menu($('#sortMenu'), b,
        dmenuOpts(key).map(([v, l]) => [v, l, String(DASH[key]) === String(v)]),
        v => { DASH[key] = key.startsWith('top') ? +v : v; renderAccount(); }); }));
  /* row clicks fall through to the storeBody delegate, which opens the product */
  const lo = $('#acctLogout'); if (lo) lo.onclick = () => toast('Stubbed in this prototype');
  body.querySelectorAll('[data-ai]').forEach(b =>
    b.addEventListener('click', () => b.classList.toggle('is-on')));
  body.querySelectorAll('[data-stub]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation(); toast('Stubbed in this prototype'); }));
  /* admin: tab switches, expandable teams, per-row Actions menus */
  body.querySelectorAll('[data-atab]').forEach(b =>
    b.addEventListener('click', () => {
      const [k, v] = b.dataset.atab.split(':');
      ADM[k] = k === 'range' ? +v : v; renderAccount(); }));
  body.querySelectorAll('[data-team]').forEach(r =>
    r.addEventListener('click', () => { const t = r.dataset.team;
      ADM.pubOpen.has(t) ? ADM.pubOpen.delete(t) : ADM.pubOpen.add(t);
      renderAccount(); }));
  body.querySelectorAll('[data-actm]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation();
      const p = DATA.find(x => x.id === +b.dataset.actm);
      const acts = S.acctSec === 'requests'
        ? [['open', 'Open'], ['edit', 'Edit'], ['accept', 'Accept'], ['reject', 'Reject'], ['del', 'Delete']]
        : [['open', 'Open'], ['edit', 'Edit'], ['revoke', 'Revoke'], ['del', 'Delete']];
      menu($('#sortMenu'), b, acts.map(([v, l]) => [v, l, false]),
        v => v === 'open' ? openDetail(p) : toast('Stubbed in this prototype')); }));
}

/* ------------------------------------------------------------- boot ------- */
function update() {
  const acct = S.page === 'account';
  $('#side').hidden = acct || S.sideHidden;
  $('#backBtn').hidden = !acct;
  $('#viewMode').hidden = acct;
  $('#sortBtn').hidden = acct;
  /* previews and the view switch only mean something for the catalog list */
  $('#prevBtn').hidden = acct;
  $('#headSep').hidden = acct;
  renderScope();
  if (acct) { renderAccount(); return; }
  renderSide(); renderCatalog();
}
syncThemeRow();
update();
