import { store, isDemo, DEFAULT_CFG, newId } from './store.js';

/* ------------------------------ categorías ------------------------------ */
const CATS = {
  comidas: { n: 'Comidas', col: '#E08A2B', libre: true, t: 'gasto' },
  ocio: { n: 'Ocio', col: '#8B5CF6', libre: true, t: 'gasto' },
  viajes: { n: 'Viajes', col: '#2A6FDB', libre: true, t: 'gasto' },
  ropa: { n: 'Ropa', col: '#D6547F', libre: true, t: 'gasto' },
  imprev: { n: 'Imprevistos', col: '#8A94A6', libre: true, t: 'gasto' },
  fijo: { n: 'Fijo', col: '#3B6FB6', t: 'gasto' },
  anual: { n: 'Pago anual', col: '#B4691F', t: 'gasto' },
  regalos: { n: 'Regalos', col: '#E0559B', t: 'gasto' },
  nomina: { n: 'Nómina', col: '#1E9E6A', t: 'ingreso' },
  otro: { n: 'Otro ingreso', col: '#4CAF7D', t: 'ingreso' },
  apartado: { n: 'Apartado', col: '#0B7A6B', t: 'traspaso' },
  mover: { n: 'Entre apartados', col: '#6B7686', t: 'mover' },
  ahorro: { n: 'Ahorro coche', col: '#0B7A6B', t: 'traspaso' },
  inversion: { n: 'Inversión', col: '#0E8F7E', t: 'traspaso' },
  reserva: { n: 'Reserva anuales', col: '#12A08C', t: 'traspaso' },
  regalos_ap: { n: 'Apartado regalos', col: '#E0559B', t: 'traspaso' }
};
const TIPOS = { gasto: 'Gasto', ingreso: 'Ingreso', traspaso: 'Traspaso' };
const catsOf = t => Object.keys(CATS).filter(k => CATS[k].t === t);
const catOf = k => CATS[k] || CATS[k === 'regalos' ? 'regalos' : 'imprev'];
// 'regalos' como traspaso se guarda como regalos_ap, pero aceptamos datos antiguos
const catFix = m => (m.t === 'traspaso' && m.c === 'regalos') ? 'regalos_ap' : m.c;

/* -------------------------------- utilidades -------------------------------- */
const $ = s => document.querySelector(s);
const eur = c => (c / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function monthKeyOf(dateStr, start) {
  let [y, m, d] = dateStr.split('-').map(Number);
  if (d >= start && start > 1) { m++; if (m > 12) { m = 1; y++; } }
  return y + '-' + pad(m);
}
function shiftKey(k, n) { let [y, m] = k.split('-').map(Number); m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + '-' + pad(m); }
function cycleRange(k, start) {
  const [y, m] = k.split('-').map(Number);
  if (start <= 1) return [new Date(y, m - 1, 1), new Date(y, m, 0)];
  return [new Date(y, m - 2, start), new Date(y, m - 1, start - 1)];
}
const label = k => { const [y, m] = k.split('-').map(Number); return MES[m - 1] + ' ' + y; };
const fdate = d => d.getDate() + ' ' + MES[d.getMonth()].slice(0, 3);
function toast(t) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 2200); }

const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4z"/>', plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L11 10 2.8 8.2 1.4 9.6l6.3 3.6-2.6 2.6-3-.5L1 16.2l4 1.8 1.8 4 1.4-1.1-.5-3 2.6-2.6 3.6 6.3z"/>', gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 1 1 0 5"/>', chart: '<path d="M3 3v18h18M7 15v3M12 9v9M17 5v13"/>', more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', chev: '<path d="M9 18l6-6-6-6"/>', rep: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>', cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', tick: '<path d="M5 12l5 5L20 7"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  plusc: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  piggy: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1M16 11h.01"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  swap: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  car: '<path d="M5 17h14M5 17a2 2 0 0 1-2-2v-4l2-5h14l2 5v4a2 2 0 0 1-2 2M5 17v2M19 17v2M3 11h18"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  l: '<path d="M15 18l-6-6 6-6"/>', r: '<path d="M9 18l6-6-6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>'
};
const CIC = { comidas: 'utensils', ocio: 'ticket', viajes: 'plane', ropa: 'shirt', imprev: 'alert', regalos: 'gift', anual: 'cal', fijo: 'home', nomina: 'banknote', otro: 'plusc', ahorro: 'piggy', inversion: 'trend', sp500: 'trend', reserva: 'cal', regalos_ap: 'gift', apartado: 'wallet', mover: 'swap' };
const TPIC = { aloj: 'bed', transp: 'car', comida: 'utensils', activ: 'ticket', compras: 'bag', otros: 'more' };
const ico = (k, map) => '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">' + (ICON[(map || CIC)[k] || 'wallet'] || ICON.wallet) + '</svg>';
const svg = k => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>';

/* --------------------------------- estado --------------------------------- */
const S = { fijos: [], anuales: [], metas: [], apartados: [], viajes: [], regalos: [], all: [], trip: null, prev: 'inicio', yr: new Date().getFullYear(), user: null, cfg: DEFAULT_CFG, tab: 'inicio', key: null, movs: [], filter: 'todos', q: '', fap: '', unsubM: null, unsubC: null, ready: false };

function curKey() { return monthKeyOf(iso(new Date()), S.cfg.cycleStart); }

function calc(movs) {
  const r = { ing: 0, tras: 0, gas: 0, gasC: 0, libre: 0, fijos: 0, por: {} };
  movs.forEach(m => {
    const c = catFix(m);
    if (m.t === 'ingreso') r.ing += m.a;
    else if (m.t === 'traspaso') r.tras += m.a;
    else if (m.t === 'mover') { /* entre apartados: no toca la cuenta */ }
    else {
      r.gas += m.a;
      if (!(m.m >= NEW_FROM && apOf(m))) r.gasC += m.a;
      if (CATS[c] && CATS[c].libre) { r.libre += m.a; r.por[c] = (r.por[c] || 0) + m.a; }
      if (c === 'fijo') r.fijos += m.a;
    }
  });
  r.queda = r.ing - r.tras - r.gasC;
  return r;
}
const libreBudget = () => S.apartados.length ? S.apartados.filter(x => x.kind === 'libre').reduce((s, x) => s + x.mes, 0) : Object.keys(CATS).filter(k => CATS[k].libre).reduce((s, k) => s + (S.cfg.budgets[k] || 0), 0);


/* ------------------------------ apartados (modelo) ------------------------------ */
const DEFAP = { comidas: 'comidas', ocio: 'ocio', viajes: 'viajes', ropa: 'ropa', imprev: 'imprev', regalos: 'regalos', anual: 'anual' };
const LEGT = { ahorro: 'ahorro', inversion: 'sp500', reserva: 'anual', regalos_ap: 'regalos' };
const NEW_FROM = '2026-11';
const apById = id => S.apartados.find(x => x.id === id);
const apName = id => { const x = apById(id); return x ? x.n : 'Cuenta principal'; };
function apOf(m) {
  if (m.t === 'gasto') { if (m.ap) return m.ap === 'cuenta' ? null : (apById(m.ap) ? m.ap : null); const d = DEFAP[catFix(m)]; return d && apById(d) ? d : null; }
  if (m.t === 'traspaso') { const x = m.ap || LEGT[catFix(m)]; return x && apById(x) ? x : null; }
  return null;
}
function saldoOf(ap) {
  let s = ap.saldo0 || 0; const f = ap.fecha0 || '0000-00-00';
  S.all.forEach(m => {
    if (m.d <= f) return;
    if (m.t === 'gasto') { if (apOf(m) === ap.id) s -= m.a; }
    else if (m.t === 'traspaso') { if (apOf(m) === ap.id) s += m.a; }
    else if (m.t === 'mover') { if (m.ap === ap.id) s += m.a; if (m.from === ap.id) s -= m.a; }
  });
  return s;
}
const apSaldoOr = (id, fb) => { const x = apById(id); return x ? saldoOf(x) : fb; };
const apMesOr = (id, fb) => { const x = apById(id); return x ? x.mes : fb; };
const ahorroNow = () => apSaldoOr('ahorro', S.cfg.ahorroSaldo);
const spendable = x => x.kind === 'libre' || x.kind === 'reserva';
const spentIn = id => S.movs.filter(m => m.t === 'gasto' && apOf(m) === id).reduce((s, m) => s + m.a, 0);
const paidIn = id => S.movs.filter(m => m.t === 'traspaso' && apOf(m) === id).reduce((s, m) => s + m.a, 0) + S.movs.filter(m => m.t === 'mover' && m.ap === id).reduce((s, m) => s + m.a, 0);
const trasIn = id => S.movs.filter(m => m.t === 'traspaso' && apOf(m) === id);
function coverFor(x, saldo) {
  if (saldo >= 0 || !spendable(x)) return null;
  const need = -saldo;
  const c = S.apartados.filter(o => o.id !== x.id && spendable(o)).map(o => ({ o, s: saldoOf(o) })).filter(z => z.s >= need).sort((p, q) => (p.o.kind === 'libre' ? 0 : 1) - (q.o.kind === 'libre' ? 0 : 1) || q.s - p.s)[0];
  return c ? { from: c.o, saldo: c.s, a: need } : { none: true, a: need };
}

/* --------------------------------- vistas --------------------------------- */
function shell(inner) {
  return '<main id="main">' + inner + '</main>' +
    '<button class="fab" id="fab" aria-label="Añadir" style="' + (['mas', 'resumen', 'ajustes'].includes(S.tab) ? 'display:none' : '') + '"><svg viewBox="0 0 24 24">' + ICON.plus + '</svg></button>' +
    '<nav class="tabs">' + [['inicio', 'Inicio', 'home'], ['registro', 'Registro', 'list'], ['fijos', 'Fijos', 'rep'], ['apartados', 'Apartados', 'wallet'], ['metas', 'Metas', 'target'], ['mas', 'Más', 'more']].map(t =>
      '<button class="tab' + (S.tab === t[0] || t[0] === 'mas' && ['viajes', 'resumen', 'ajustes'].includes(S.tab) || t[0] === 'apartados' && ['anuales', 'regalos'].includes(S.tab) ? ' on' : '') + '" data-tab="' + t[0] + '">' + svg(t[2]) + t[1] + '</button>').join('') + '</nav>';
}
function mnav() {
  return '<div class="mnav"><button data-m="-1" aria-label="Mes anterior">' + svg('l') + '</button><span>' + label(S.key) + '</span><button data-m="1" aria-label="Mes siguiente">' + svg('r') + '</button></div>';
}
function viewInicio() {
  const r = calc(S.movs), [a, b] = cycleRange(S.key, S.cfg.cycleStart), libres = S.apartados.filter(x => x.kind === 'libre');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((b - today) / 864e5) + 1, live = today >= a && today <= b;
  const ck = curKey(), isCur = S.key === ck, isPast = S.key < ck;
  let left, bud, cats, neg = '';
  if (libres.length && isCur) {
    const sal = libres.map(x => ({ x, s: saldoOf(x), sp: spentIn(x.id) }));
    left = sal.reduce((t, z) => t + z.s, 0); bud = libreBudget();
    cats = sal.map(z => { const p = z.x.mes ? Math.min(100, Math.round(z.sp / z.x.mes * 100)) : (z.sp ? 100 : 0);
      return '<div class="cat"><div class="t"><span>' + esc(z.x.n) + '</span><span>' + eur(z.sp) + ' de ' + eur(z.x.mes) + ' · <b class="' + (z.s < 0 ? 'neg' : '') + '" style="color:' + (z.s < 0 ? '' : 'var(--ink)') + '">' + eur(z.s) + '</b></span></div><div class="bar"><i style="width:' + p + '%;background:' + (z.sp > z.x.mes ? 'var(--neg)' : (z.x.color || 'var(--accent)')) + '"></i></div></div>'; }).join('');
    if (sal.some(z => z.s < 0)) neg = '<div class="hint warn">Hay apartados en negativo. <button class="chip" data-tab="apartados" style="margin-left:6px">Ver apartados</button></div>';
  } else if (libres.length) {
    bud = libreBudget(); left = bud - r.libre;
    cats = libres.map(x => { const sp = spentIn(x.id), p = x.mes ? Math.min(100, Math.round(sp / x.mes * 100)) : (sp ? 100 : 0);
      return '<div class="cat"><div class="t"><span>' + esc(x.n) + '</span><span>' + eur(sp) + ' de ' + eur(x.mes) + '</span></div><div class="bar"><i style="width:' + p + '%;background:' + (sp > x.mes ? 'var(--neg)' : (x.color || 'var(--accent)')) + '"></i></div></div>'; }).join('');
  } else {
    bud = libreBudget(); left = bud - r.libre;
    cats = Object.keys(CATS).filter(k => CATS[k].libre).map(k => { const sp = r.por[k] || 0, bg = S.cfg.budgets[k] || 0, p = bg ? Math.min(100, Math.round(sp / bg * 100)) : (sp ? 100 : 0);
      return '<div class="cat"><div class="t"><span>' + CATS[k].n + '</span><span>' + eur(sp) + ' de ' + eur(bg) + '</span></div><div class="bar"><i style="width:' + p + '%;background:' + (sp > bg ? 'var(--neg)' : CATS[k].col) + '"></i></div></div>'; }).join('');
  }
  const perDay = live && days > 0 ? Math.max(0, left) / days : null, pct = bud ? Math.min(100, Math.round(r.libre / bud * 100)) : 0;
  return '<div class="head"><div><h1>Inicio</h1><div class="sub">' + fdate(a) + ' – ' + fdate(b) + '</div></div><div style="display:flex;gap:6px;align-items:center">' + mnav() + '<button class="gear" data-tab="ajustes" aria-label="Ajustes">' + svg('cog') + '</button></div></div>' +
    '<div class="hero"><div class="l">' + (libres.length && isCur ? 'Te queda en tus apartados libres' : isPast ? 'Te quedó de la previsión libre' : 'Te queda de la previsión libre') + '</div><div class="big' + (left < 0 ? '" style="color:#FF8A80' : '') + '">' + eur(left) + '</div>' +
    '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="row2"><span>Gastado este ciclo <b>' + eur(r.libre) + '</b> de ' + eur(bud) + '</span>' + (isCur && perDay != null ? '<span><b>' + eur(Math.round(perDay)) + '</b> al día</span>' : '') + '</div></div>' + neg +
    '<div class="grid2"><div class="stat"><div class="l">Entra</div><div class="v pos">' + eur(r.ing) + '</div></div>' +
    '<div class="stat"><div class="l">Sale de la cuenta</div><div class="v">' + eur(r.gasC + r.tras) + '</div></div>' +
    '<div class="stat"><div class="l">Queda en cuenta</div><div class="v ' + (r.queda < 0 ? 'neg' : '') + '">' + eur(r.queda) + '</div></div>' +
    '<div class="stat"><div class="l">Traspasado a apartados</div><div class="v">' + eur(r.tras) + '</div></div></div>' +
    (r.ing === 0 && S.movs.length ? '<div class="hint warn">Este ciclo no tiene ninguna nómina apuntada, por eso "Queda en cuenta" sale en negativo. ' + '<button class="chip" id="nomina" style="margin-left:6px">Apuntar nómina</button>' + '</div>' : '') +
    (isCur ? avisosCard() + cuentaCard() : '') +
    (S.key >= ck ? pendCard() : '') +
    '<h2>Gastos libres por apartado</h2><div class="card" style="gap:12px">' + cats + '<div class="sub" style="margin:0">' + (libres.length && isCur ? 'Gastado este ciclo de la previsión · saldo total del apartado' : 'Gastado en el ciclo de la previsión mensual') + '</div></div>';
}
function viewRegistro() {
  const f = S.filter, q = S.q.trim().toLowerCase(), searching = !!(q || S.fap);
  const apOK = m => !S.fap || (S.fap === 'cuenta' ? (m.t !== 'mover' && !(m.t === 'traspaso') && (!apOf(m) || apOf(m) === 'cuenta')) : (apOf(m) === S.fap || m.from === S.fap));
  const txtOK = m => !q || [m.n, catOf(m.t === 'mover' ? 'mover' : catFix(m)).n, apOf(m) ? apName(apOf(m)) : '', String(m.a / 100).replace('.', ','), m.d].join(' ').toLowerCase().includes(q);
  const items = (searching ? S.all : S.movs).filter(apOK).filter(txtOK).filter(m => f === 'todos' || m.t === f || (f === 'traspaso' && m.t === 'mover') || (f === 'libre' && m.t === 'gasto' && CATS[catFix(m)] && CATS[catFix(m)].libre)).sort((x, y) => y.d.localeCompare(x.d));
  const chips = [['todos', 'Todo'], ['gasto', 'Gastos'], ['libre', 'Libres'], ['ingreso', 'Ingresos'], ['traspaso', 'Traspasos']].map(c =>
    '<button class="chip' + (f === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + c[1] + '</button>').join('');
  let h = '', last = '';
  items.forEach(m => {
    if (m.d !== last) { if (last) h += '</div>'; const d = new Date(m.d + 'T00:00:00'); h += '<div class="day">' + fdate(d) + '</div><div class="list">'; last = m.d; }
    const c = catOf(m.t === 'mover' ? 'mover' : catFix(m)), sign = m.t === 'ingreso' ? '+' : m.t === 'gasto' ? '−' : '';
    h += '<button class="it" data-id="' + m.id + '"><div class="dot" style="background:' + c.col + '">' + ico(m.t === 'mover' ? 'mover' : m.t === 'traspaso' ? (apOf(m) || 'apartado') : catFix(m)) + '</div><div class="m"><div class="n">' + esc(m.n || (m.t === 'mover' ? 'Mover dinero' : c.n)) + '</div><div class="c">' + (m.t === 'mover' ? esc(apName(m.from)) + ' → ' + esc(apName(m.ap)) : m.t === 'traspaso' ? 'Traspaso → ' + esc(apOf(m) ? apName(apOf(m)) : c.n) : c.n + (m.t === 'gasto' && apOf(m) && apOf(m) !== DEFAP[catFix(m)] ? ' · de ' + esc(apName(apOf(m))) : '')) + '</div></div><div class="a ' + (m.t === 'ingreso' ? 'pos' : '') + '">' + sign + eur(m.a) + '</div></button>';
  });
  if (last) h += '</div>';
  return '<div class="head"><div><h1>Registro</h1><div class="sub">' + items.length + ' movimientos' + (searching ? ' · en todos los ciclos' : '') + (searching ? ' · ' + eur(items.reduce((t, m) => t + (m.t === 'gasto' ? m.a : 0), 0)) + ' en gastos' : '') + '</div></div>' + (searching ? '' : mnav()) + '</div>' +
    '<div class="f"><input class="inp" id="q" type="search" placeholder="Buscar concepto, importe…" value="' + esc(S.q) + '"><select class="inp" id="fap" style="max-width:140px"><option value="">Todo</option><option value="cuenta"' + (S.fap === 'cuenta' ? ' selected' : '') + '>Cuenta</option>' + S.apartados.map(x => '<option value="' + x.id + '"' + (S.fap === x.id ? ' selected' : '') + '>' + esc(x.n) + '</option>').join('') + '</select></div><div class="chips">' + chips + '</div>' +
    (h || '<div class="empty">' + (searching ? 'Nada coincide con la búsqueda.' : 'Aún no hay movimientos en este ciclo.<br>Pulsa + para añadir el primero.') + '</div>');
}
function viewAjustes() {
  const th = localStorage.getItem('fin-theme') || 'auto';
    return '<div class="head"><div style="display:flex;gap:10px;align-items:center"><button class="gear" data-tab="' + (S.prev || 'inicio') + '" aria-label="Volver">' + svg('l') + '</button><div><h1>Ajustes</h1><div class="sub">' + esc(S.user ? S.user.name : '') + '</div></div></div></div>' +
    (isDemo ? '<div class="banner"><b>Modo demo.</b> Los datos solo se guardan en este navegador. Configura Firebase (ver README) para sincronizar entre dispositivos.</div>' : '') +
    '<div class="card"><div style="font-weight:600">Tema</div><div class="seg" id="theme">' + [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']].map(t => '<button data-th="' + t[0] + '" class="' + (th === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>' +
    '<div class="card"><div style="font-weight:600">Ciclo</div><div class="set"><span>Día en que empieza tu ciclo (cobro)</span><input class="inp" id="cs" type="number" min="1" max="28" value="' + S.cfg.cycleStart + '"></div>' +
    '<div class="sub" style="margin:0">Un movimiento desde ese día cuenta para el mes siguiente.</div></div>' +
    '<div class="hint">Las aportaciones mensuales, los presupuestos y los saldos de cada apartado se editan ahora en la pestaña <b>Apartados</b>.</div>' +
    '<button class="btn" id="saveCfg">Guardar ajustes</button>' +
    '<div class="card"><div style="font-weight:600">Copia de seguridad</div><div class="sub" style="margin:0">Exporta todos tus datos a un archivo, o importa uno para cargarlos de golpe (por ejemplo, el de la carga inicial).</div><div class="f"><button class="btn sec" id="exp">Exportar</button><button class="btn sec" id="imp">Importar</button></div><input type="file" id="impf" accept="application/json,.json" hidden></div>' +
    (isDemo ? '<button class="btn sec" id="reset">Restablecer datos de demo</button>' : '<button class="btn sec" id="out">Cerrar sesión</button>');
}
function viewLogin() {
  return '<div class="login"><img src="icons/icon-192.png" alt=""><h1>Finanzas</h1><div class="sub">Tu asistente financiero personal</div><button class="btn" id="login" style="max-width:300px">Entrar con Google</button><div class="sub" id="lerr"></div></div>';
}

/* --------------------------------- render --------------------------------- */
function render() {
  const app = $('#app');
  if (!S.user) { app.innerHTML = S.ready ? viewLogin() : '<div class="login"><div class="sub">Cargando…</div></div>'; const b = $('#login'); if (b) b.onclick = async () => { try { await store.signIn(); } catch (e) { $('#lerr').textContent = 'No se pudo iniciar sesión: ' + (e.code || e.message); } }; return; }
  const keep = $('#main') ? $('#main').scrollTop : 0;
  app.innerHTML = shell(({ inicio: viewInicio, registro: viewRegistro, fijos: viewFijos, apartados: viewApartados, anuales: viewAnuales, metas: viewMetas, mas: viewMas, viajes: () => S.trip ? viewViaje() : viewViajes(), regalos: viewRegalos, resumen: viewResumen, ajustes: viewAjustes })[S.tab]());
  $('#main').scrollTop = keep;
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if (['ajustes', 'anuales', 'regalos'].includes(b.dataset.tab)) S.prev = S.tab; S.trip = null; S.tab = b.dataset.tab; render(); });
  app.querySelectorAll('[data-trip]').forEach(b => b.onclick = () => { S.trip = b.dataset.trip; render(); });
  app.querySelectorAll('[data-rg]').forEach(b => b.onclick = () => openForm('regalos', S.regalos.find(x => x.id === b.dataset.rg)));
  app.querySelectorAll('[data-etrip]').forEach(b => b.onclick = () => openForm('viajes', S.viajes.find(x => x.id === S.trip)));
  app.querySelectorAll('[data-yr]').forEach(b => b.onclick = () => { S.yr += +b.dataset.yr; render(); });
  app.querySelectorAll('[data-meta]').forEach(b => b.onclick = () => openMeta(S.metas.find(x => x.id === b.dataset.meta)));
  const dd = $('#deuda'); if (dd) dd.onclick = openDeuda;
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { S.key = shiftKey(S.key, +b.dataset.m); subscribe(); render(); });
  app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filter = b.dataset.f; render(); });
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => openMov(S.movs.find(m => m.id === b.dataset.id) || S.all.find(m => m.id === b.dataset.id)));
  app.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => openApartado(apById(b.dataset.ap)));
  app.querySelectorAll('[data-tch]').forEach(b => b.onclick = () => toggleTraspaso(b.dataset.tch));
  app.querySelectorAll('[data-cover]').forEach(b => b.onclick = () => { const [f, t, am] = b.dataset.cover.split(':'); doMover(f, t, +am); });
  const qi = $('#q'); if (qi) { qi.oninput = () => { S.q = qi.value; const p = qi.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); }; $('#fap').onchange = e => { S.fap = e.target.value; render(); }; }
  const nb = $('#nomina'); if (nb) nb.onclick = openNomina;
  const cb = $('#concil'); if (cb) cb.onclick = openConciliar;
  const mvb = $('#mover'); if (mvb) mvb.onclick = () => openMover(null);
  $('#fab').onclick = () => S.tab === 'fijos' ? openItem('fijos', null) : S.tab === 'anuales' ? openItem('anuales', null) : S.tab === 'apartados' ? openApartado(null) : S.tab === 'metas' ? openMeta(null) : S.tab === 'regalos' ? openForm('regalos', null) : S.tab === 'viajes' ? (S.trip ? openSheet(null, { v: S.trip }) : openForm('viajes', null)) : openSheet(null);
  app.querySelectorAll('[data-chk]').forEach(b => b.onclick = () => toggleFijo(b.dataset.chk));
  app.querySelectorAll('[data-achk]').forEach(b => b.onclick = () => toggleAnual(b.dataset.achk));
  app.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { const [k, id] = b.dataset.edit.split(':'); openItem(k, S[k].find(x => x.id === id)); });
  if (S.tab === 'ajustes') bindAjustes();
}
function bindAjustes() {
  document.querySelectorAll('[data-th]').forEach(b => b.onclick = () => {
    const v = b.dataset.th;
    try { v === 'auto' ? localStorage.removeItem('fin-theme') : localStorage.setItem('fin-theme', v); } catch (e) {}
    if (v === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
    render();
  });
  $('#saveCfg').onclick = async () => {
    const cs = Math.min(28, Math.max(1, parseInt($('#cs').value) || 25));
    await store.saveConfig({ ...S.cfg, cycleStart: cs }); toast('Ajustes guardados');
  };
  $('#exp').onclick = async () => {
    const take = k => once(cb => store.subscribeList(k, cb));
    const movs = S.all.slice();
    const data = { version: 1, config: S.cfg, fijos: await take('fijos'), anuales: await take('anuales'), metas: await take('metas'), viajes: await take('viajes'), regalos: await take('regalos'), apartados: await take('apartados'), movs };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    const l = document.createElement('a'); l.href = url; l.download = 'finanzas-' + iso(new Date()) + '.json'; l.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('#imp').onclick = () => $('#impf').click();
  $('#impf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text()); const n = (d.movs || []).length + (d.fijos || []).length + (d.anuales || []).length + (d.metas || []).length + (d.viajes || []).length + (d.regalos || []).length + (d.apartados || []).length;
      if (!confirm('Se van a importar ' + n + ' elementos (los que ya existan con el mismo id se sobrescriben). ¿Continuar?')) return;
      if (d.config) await store.saveConfig(Object.assign({}, DEFAULT_CFG, d.config));
      for (const x of d.fijos || []) await store.saveItem('fijos', x);
      for (const x of d.anuales || []) await store.saveItem('anuales', x);
      for (const x of d.metas || []) await store.saveItem('metas', x);
      for (const x of d.viajes || []) await store.saveItem('viajes', x);
      for (const x of d.regalos || []) await store.saveItem('regalos', x);
      for (const x of d.apartados || []) await store.saveItem('apartados', x);
      for (const x of d.movs || []) await store.saveMov(x);
      toast('Importado: ' + n + ' elementos');
    } catch (err) { toast('Archivo no válido'); console.error(err); }
    e.target.value = '';
  };
  const o = $('#out'); if (o) o.onclick = () => store.signOut();
  const r = $('#reset'); if (r) r.onclick = () => { if (confirm('¿Restablecer los datos de demo?')) store.resetDemo(); };
}

/* ------------------------- hoja de añadir / editar ------------------------- */
function openMov(m) { if (m && m.t === 'mover') openMover(m); else openSheet(m); }
function openSheet(mov, preset) {
  const ed = !!mov;
  const st = { id: ed ? mov.id : newId(), t: ed ? mov.t : 'gasto', c: ed ? catFix(mov) : 'comidas', amt: ed ? String((mov.a / 100).toFixed(2)).replace(/\.00$/, '') : '', d: ed ? mov.d : iso(new Date()), n: ed ? (mov.n || '') : '', v: ed ? (mov.v || '') : (preset && preset.v) || '', tp: ed ? (mov.tp || '') : '', g: ed ? (mov.g || '') : '', ap: ed ? (mov.t === 'traspaso' ? (apOf(mov) || '') : (mov.ap || '')) : '' };
  if (!ed && S.apartados.length) st.ap = '';
  const bg = $('#sheetBg'), sh = $('#sheet');
  const draw = () => {
    const a = st.amt === '' ? '0' : st.amt.replace('.', ',');
    sh.innerHTML = '<div class="seg">' + Object.keys(TIPOS).map(t => '<button data-t="' + t + '" class="' + (st.t === t ? 'on' : '') + '">' + TIPOS[t] + '</button>').join('') + '</div>' +
      '<div class="amt">' + a + ' €</div>' +
      (st.t === 'traspaso' && S.apartados.length ? '<select class="inp" id="xa">' + S.apartados.map(x => '<option value="' + x.id + '"' + (st.ap === x.id ? ' selected' : '') + '>Traspaso a ' + esc(x.n) + '</option>').join('') + '</select>' : '') +
      (st.t === 'gasto' && S.apartados.length ? '<select class="inp" id="xp"><option value="">Pagar desde: ' + (DEFAP[st.c] && apById(DEFAP[st.c]) ? 'apartado ' + esc(apName(DEFAP[st.c])) + ' (auto)' : 'cuenta principal (auto)') + '</option><option value="cuenta"' + (st.ap === 'cuenta' ? ' selected' : '') + '>Cuenta principal</option>' + S.apartados.filter(spendable).map(x => '<option value="' + x.id + '"' + (st.ap === x.id ? ' selected' : '') + '>' + esc(x.n) + ' (saldo ' + eur(saldoOf(x)) + ')</option>').join('') + '</select>' : '') +
      '<div class="chips" style="flex-wrap:wrap' + (st.t === 'traspaso' && S.apartados.length ? ';display:none' : '') + '">' + catsOf(st.t).map(k => '<button class="chip' + (st.c === k ? ' on' : '') + '" data-c="' + k + '">' + CATS[k].n + '</button>').join('') + '</div>' +
      (st.t === 'gasto' ? '<div class="f"><select class="inp" id="xv"><option value="">Sin viaje</option>' + S.viajes.map(v => '<option value="' + v.id + '"' + (st.v === v.id ? ' selected' : '') + '>' + esc(v.n) + '</option>').join('') + '</select>' + (st.v ? '<select class="inp" id="xt">' + Object.keys(TP).map(k => '<option value="' + k + '"' + (st.tp === k ? ' selected' : '') + '>' + TP[k] + '</option>').join('') + '</select>' : '') + '</div>' : '') +
      (st.t === 'gasto' && st.c === 'regalos' ? '<select class="inp" id="xg"><option value="">¿Para quién?</option>' + S.regalos.map(v => '<option value="' + v.id + '"' + (st.g === v.id ? ' selected' : '') + '>' + esc(v.n) + '</option>').join('') + '</select>' : '') +
      '<div class="f"><input id="sn" placeholder="Concepto (opcional)" value="' + esc(st.n) + '"><input id="sd" type="date" value="' + st.d + '" style="max-width:150px"></div>' +
      '<div class="keys">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map(k => '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>' +
      '<button class="btn" id="sv">' + (ed ? 'Guardar cambios' : 'Añadir') + '</button>' + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
    sh.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { keepText(); st.t = b.dataset.t; if (CATS[st.c].t !== st.t) st.c = catsOf(st.t)[0]; st.ap = st.t === 'traspaso' && S.apartados[0] ? S.apartados[0].id : ''; draw(); });
    sh.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { keepText(); st.c = b.dataset.c; draw(); });
    sh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      keepText(); const k = b.dataset.k;
      if (k === '⌫') st.amt = st.amt.slice(0, -1);
      else if (k === ',') { if (!st.amt.includes('.')) st.amt = (st.amt || '0') + '.'; }
      else { const dec = st.amt.split('.')[1]; if (dec === undefined || dec.length < 2) st.amt = (st.amt === '0' ? '' : st.amt) + k; }
      draw();
    });
    const xv = $('#xv'); if (xv) xv.onchange = () => { keepText(); if (st.v && !st.tp) st.tp = 'otros'; draw(); };
    $('#cx').onclick = close;
    $('#sv').onclick = async () => {
      keepText(); const a = Math.round(parseFloat(st.amt || '0') * 100);
      if (!a || a < 0) { toast('Pon un importe'); return; }
      if (!st.d) { toast('Pon una fecha'); return; }
      const m = ed && mov.d === st.d && mov.m ? mov.m : monthKeyOf(st.d, S.cfg.cycleStart);
      const out = { id: st.id, d: st.d, a, t: st.t, c: st.c, n: st.n.trim(), m };
      if (st.t === 'gasto' && st.v) { out.v = st.v; out.tp = st.tp || 'otros'; }
      if (st.t === 'gasto' && st.c === 'regalos' && st.g) out.g = st.g;
      if (st.t === 'gasto' && st.ap) out.ap = st.ap;
      if (st.t === 'traspaso' && S.apartados.length) { out.ap = st.ap || S.apartados[0].id; out.c = 'apartado'; }
      try { await store.saveMov(out); close(); toast(ed ? 'Guardado' : 'Añadido'); } catch (e) { toast('Error al guardar'); console.error(e); }
    };
    const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar este movimiento?')) { await store.deleteMov(st.id); close(); toast('Eliminado'); } };
  };
  const keepText = () => { const n = $('#sn'), d = $('#sd'), v = $('#xv'), t = $('#xt'), g = $('#xg'), xp = $('#xp'), xa = $('#xa'); if (xp) st.ap = xp.value; if (xa) st.ap = xa.value; if (n) st.n = n.value; if (d) st.d = d.value; if (v) st.v = v.value; if (t) st.tp = t.value; if (g) st.g = g.value; };
  const close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  bg.onclick = e => { if (e.target === bg) close(); };
  draw(); bg.classList.add('on');
}


/* ------------------------- fijos, suscripciones, anuales ------------------------- */
const sumA = l => l.reduce((s, x) => s + x.a, 0);
const paidMov = it => S.movs.find(m => m.f === it.id && m.t === 'gasto');
function fijosStats() {
  const all = S.fijos, paid = all.filter(paidMov);
  return { total: sumA(all), pagado: sumA(paid), pend: sumA(all) - sumA(paid), nPend: all.length - paid.length };
}
function fijoDate(day) {
  const [y, m] = S.key.split('-').map(Number), cs = S.cfg.cycleStart, d = Math.min(day, 28 + (day > 28 ? 0 : 0));
  return day >= cs && cs > 1 ? new Date(y, m - 2, Math.min(day, 28)) : new Date(y, m - 1, Math.min(day, 28));
}
function avisos() {
  const out = [], today = new Date(); today.setHours(0, 0, 0, 0);
  S.apartados.forEach(x => { const s = saldoOf(x); if (s < 0) out.push({ k: 'neg', t: x.n + ' está en negativo (' + eur(s) + ')', go: 'apartados' }); });
  S.fijos.filter(x => !paidMov(x)).forEach(x => {
    const dd = Math.round((fijoDate(x.day) - today) / 864e5);
    if (dd < 0) out.push({ k: 'neg', t: x.n + ' (' + eur(x.a) + ') tenía que salir hace ' + (-dd) + (dd === -1 ? ' día' : ' días'), go: 'fijos' });
    else if (dd <= 3) out.push({ k: 'warn', t: x.n + ' (' + eur(x.a) + ') sale ' + (dd === 0 ? 'hoy' : dd === 1 ? 'mañana' : 'en ' + dd + ' días'), go: 'fijos' });
  });
  const mes = S.apartados.filter(x => x.mes > 0), dn = S.movs.filter(m => m.t === 'traspaso').length;
  if (mes.length && !dn) out.push({ k: 'warn', t: 'Aún no has traspasado nada a apartados este ciclo', go: 'apartados' });
  const lb = libreBudget(); if (lb && calc(S.movs).libre > lb) out.push({ k: 'neg', t: 'Has superado la previsión libre del ciclo', go: 'inicio' });
  return out;
}
function avisosCard() {
  const a = avisos(); if (!a.length) return '';
  return '<div class="card" style="gap:6px"><div style="font-weight:600">Avisos</div>' + a.slice(0, 6).map(x => '<button class="it" data-tab="' + x.go + '" style="padding:6px 0"><div class="m"><div class="n" style="white-space:normal;color:' + (x.k === 'neg' ? 'var(--neg)' : 'var(--warn-ink)') + '">' + (x.k === 'neg' ? '● ' : '○ ') + esc(x.t) + '</div></div></button>').join('') + '</div>';
}
function calcCuenta() {
  const c = S.cfg.cuenta; if (!c) return null;
  let v = c.saldo;
  S.all.filter(m => m.d > c.fecha).forEach(m => {
    if (m.t === 'ingreso') v += m.a; else if (m.t === 'traspaso') v -= m.a;
    else if (m.t === 'gasto' && !(m.m >= NEW_FROM && apOf(m))) v -= m.a;
  });
  return v;
}
function cuentaCard() {
  const v = calcCuenta(), c = S.cfg.cuenta;
  return '<div class="card"><div class="row2"><span>Saldo estimado en la cuenta</span><b class="' + (v != null && v < 0 ? 'neg' : '') + '">' + (v == null ? '—' : eur(v)) + '</b></div><div class="sub" style="margin:0">' + (c ? 'Conciliado el ' + fdate(new Date(c.fecha + 'T00:00:00')) + ' con ' + eur(c.saldo) : 'Aún no has conciliado con el banco') + '</div><button class="btn sec" id="concil" style="padding:10px;font-size:14px">Conciliar con el banco</button></div>';
}
function openConciliar() {
  const bg = $('#sheetBg'), sh = $('#sheet'), est = calcCuenta(), hist = (S.cfg.concil || []).slice(-3).reverse();
  const estAp = S.apartados.filter(spendable).reduce((t, x) => t + saldoOf(x), 0), estAh = apById('ahorro') ? saldoOf(apById('ahorro')) : null;
  const fld = (id, l, e) => '<div class="sub" style="margin:0">' + l + ' · la app dice <b>' + (e == null ? '—' : eur(e)) + '</b></div><input class="inp" id="' + id + '" inputmode="decimal" placeholder="Saldo real (€)"><div id="' + id + 'd" class="hint" style="display:none"></div>';
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">Conciliar con el banco</div><div class="sub">Pon lo que ves en el banco; deja en blanco lo que no quieras comprobar.</div>' +
    fld('cb', 'Cuenta principal (sin apartados)', est) + fld('cp', 'Apartados dentro de la principal', estAp) + (estAh != null ? fld('cq', 'Cuenta ahorro (coche)', estAh) : '') +
    (hist.length ? '<div class="sub">Últimas (principal): ' + hist.map(h => fdate(new Date(h.fecha + 'T00:00:00')) + ' (' + (h.dif >= 0 ? '+' : '') + eur(h.dif) + ')').join(' · ') + '</div>' : '') +
    '<button class="btn" id="cs2">Guardar</button><button class="btn sec" id="cx">Cancelar</button>';
  const val = id => { const el = $('#' + id); if (!el) return null; const n = parseFloat(String(el.value).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : Math.round(n * 100); };
  const close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const show = (id, e, msg) => { const v = val(id), d = $('#' + id + 'd'); if (!d) return; if (v == null || e == null) { d.style.display = 'none'; return; } const dif = v - e; d.style.display = 'block'; d.className = 'hint' + (Math.abs(dif) > 100 ? ' warn' : ''); d.textContent = Math.abs(dif) < 1 ? 'Cuadra perfecto.' : (dif > 0 ? 'Tienes ' + eur(dif) + ' más que la app. ' + msg[0] : 'Tienes ' + eur(-dif) + ' menos que la app. ' + msg[1]); };
  [['cb', est, ['Falta apuntar un ingreso o sobra un gasto.', 'Falta apuntar algún gasto.']], ['cp', estAp, ['Quizá falta un traspaso a un apartado.', 'Quizá falta un gasto en algún apartado o hay un traspaso de más.']], ['cq', estAh, ['Falta un traspaso al ahorro.', 'Hay un traspaso de más o un gasto sin apuntar.']]].forEach(z => { const el = $('#' + z[0]); if (el) el.oninput = () => show(z[0], z[1], z[2]); });
  $('#cx').onclick = close; bg.onclick = e => { if (e.target === bg) close(); };
  $('#cs2').onclick = async () => {
    const v = val('cb'); if (v == null) { toast('Pon al menos el saldo de la principal'); return; }
    const hoy = iso(new Date()), concil = (S.cfg.concil || []).concat(est == null ? [] : [{ fecha: hoy, dif: v - est }]).slice(-12);
    await store.saveConfig({ ...S.cfg, cuenta: { fecha: hoy, saldo: v }, concil }); close(); toast('Saldo conciliado');
  };
  bg.classList.add('on');
}
function openNomina() {
  const bg = $('#sheetBg'), sh = $('#sheet'), last = (S.cfg.nomina && S.cfg.nomina.a) || 0;
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">Apuntar nómina</div><div class="sub">Se rellena con tu última nómina; cámbiala si este mes es distinta.</div>' +
    '<div class="f"><input class="inp" id="na" inputmode="decimal" placeholder="Importe (€)" value="' + (last ? String(last / 100).replace('.', ',') : '') + '"><input class="inp" id="nd" type="date" value="' + (S.key === curKey() ? iso(new Date()) : iso(cycleRange(S.key, S.cfg.cycleStart)[0])) + '" style="max-width:150px"></div>' +
    '<button class="btn" id="ns">Apuntar</button><button class="btn sec" id="cx">Cancelar</button>';
  const close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  $('#cx').onclick = close; bg.onclick = e => { if (e.target === bg) close(); };
  $('#ns').onclick = async () => {
    const a = Math.round(parseFloat(String($('#na').value).replace(',', '.')) * 100), d = $('#nd').value;
    if (!a || a < 0 || !d) { toast('Pon importe y fecha'); return; }
    await store.saveMov({ id: newId(), d, a, t: 'ingreso', c: 'nomina', n: 'Nómina', m: monthKeyOf(d, S.cfg.cycleStart) });
    await store.saveConfig({ ...S.cfg, nomina: { a } }); close(); toast('Nómina apuntada');
  };
  bg.classList.add('on');
}
function pendCard() {
  if (!S.fijos.length) return '';
  const f = fijosStats(), r = calc(S.movs), real = r.queda - f.pend;
  return '<div class="card"><div class="row2"><span>Fijos pendientes de pagar</span><b>' + eur(f.pend) + '</b></div><div class="row2"><span>Te quedaría tras pagarlos</span><b class="' + (real < 0 ? 'neg' : 'pos') + '">' + eur(real) + '</b></div></div>';
}
function chk(on, attr, id) { return '<button class="chk' + (on ? ' on' : '') + '" ' + attr + '="' + id + '" aria-label="' + (on ? 'Pagado' : 'Marcar como pagado') + '">' + (on ? '<svg viewBox="0 0 24 24">' + ICON.tick + '</svg>' : '') + '</button>'; }
function viewFijos() {
  const f = fijosStats(), pct = f.total ? Math.round(f.pagado / f.total * 100) : 0;
  const item = it => {
    const m = paidMov(it);
    return '<div class="row">' + chk(!!m, 'data-chk', it.id) + '<button class="m" data-edit="fijos:' + it.id + '"><div class="n" style="font-size:14px;font-weight:500">' + esc(it.n) + '</div><div class="c" style="font-size:12px;color:var(--muted)">' + (m ? 'Pagado · ' + fdate(new Date(m.d + 'T00:00:00')) : 'Pendiente · día ' + it.day) + '</div></button><div class="a" style="font-size:15px;font-weight:600;font-variant-numeric:tabular-nums">' + eur(it.a) + '</div></div>';
  };
  const fijos = S.fijos.filter(x => x.kind !== 'sub').sort((a, b) => a.day - b.day), subs = S.fijos.filter(x => x.kind === 'sub').sort((a, b) => a.day - b.day);
  const sm = sumA(subs);
  return '<div class="head"><div><h1>Fijos</h1><div class="sub">Lo que sale cada ciclo, sin falta</div></div>' + mnav() + '</div>' +
    '<div class="card"><div class="row2"><span style="color:var(--muted)">Fijos de este ciclo</span><span style="color:var(--muted)">' + eur(f.pagado) + ' de ' + eur(f.total) + '</span></div><div style="font-size:32px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums">' + eur(f.total) + '</div><div class="bar"><i style="width:' + pct + '%"></i></div><div class="sub">' + (f.nPend ? 'Te faltan <b style="color:var(--ink)">' + eur(f.pend) + '</b> por pagar este ciclo' : 'Todo pagado este ciclo') + '</div></div>' +
    '<h2>Cada mes</h2><div class="list">' + (fijos.map(item).join('') || '<div class="empty">Pulsa + para añadir un gasto fijo.</div>') + '</div>' +
    '<div class="head" style="align-items:baseline"><h2 style="padding:0">Suscripciones</h2><span class="sub">' + eur(sm) + ' al mes · ' + eur(sm * 12) + ' al año</span></div><div class="list">' + (subs.map(item).join('') || '<div class="empty">Sin suscripciones.</div>') + '</div>';
}
async function toggleFijo(id) {
  const it = S.fijos.find(x => x.id === id), m = paidMov(it);
  if (m) { await store.deleteMov(m.id); return; }
  const [a, b] = cycleRange(S.key, S.cfg.cycleStart), t = new Date(); t.setHours(0, 0, 0, 0);
  const d = t >= a && t <= b ? t : b;
  await store.saveMov({ id: 'f-' + id + '-' + S.key, d: iso(d), a: it.a, t: 'gasto', c: 'fijo', n: it.n, m: S.key, f: id });
}
const occYear = it => { const n = new Date(); return it.month >= n.getMonth() + 1 ? n.getFullYear() : n.getFullYear() + 1; };
const occIdx = it => occYear(it) * 12 + it.month;
function viewAnuales() {
  const n = new Date(), nowIdx = n.getFullYear() * 12 + n.getMonth() + 1;
  const list = S.anuales.slice().sort((a, b) => occIdx(a) - occIdx(b)), tot = sumA(list), need = Math.round(tot / 12);
  const unpaid = list.filter(x => x.pagado !== occYear(x));
  let cum = 0, worst = null;
  unpaid.forEach(it => { cum += it.a; const bal = apSaldoOr('anual', S.cfg.reservaSaldo) + apMesOr('anual', S.cfg.reservaMes) * Math.max(0, occIdx(it) - nowIdx) - cum; if (!worst || bal < worst.bal) worst = { bal, it }; });
  let hint = '';
  if (worst) hint = worst.bal < 0
    ? '<div class="hint warn">Con tu aportación actual te faltarán <b>' + eur(-worst.bal) + '</b> para <b>' + esc(worst.it.n) + '</b> (' + MES[worst.it.month - 1] + '). Sube la aportación o adelanta un pago extra a la reserva.</div>'
    : '<div class="hint">Tu reserva cubre todos los pagos. El punto más justo es <b>' + esc(worst.it.n) + '</b> (' + MES[worst.it.month - 1] + '): te sobrarían <b>' + eur(worst.bal) + '</b>.</div>';
  return '<div class="head"><div style="display:flex;gap:10px;align-items:center"><button class="gear" data-tab="' + (S.prev || 'apartados') + '" aria-label="Volver">' + svg('l') + '</button><div><h1>Anuales</h1><div class="sub">Pagos de una vez al año, ya reservados</div></div></div></div>' +
    '<div class="hero"><div class="l">En tu reserva ahora</div><div class="big">' + eur(apSaldoOr('anual', S.cfg.reservaSaldo)) + '</div><div class="row2"><div><div class="l">Aportas</div><b>' + eur(apMesOr('anual', S.cfg.reservaMes)) + ' / mes</b></div><div><div class="l">Necesitas</div><b>' + eur(need) + ' / mes</b></div><div><div class="l">Total al año</div><b>' + eur(tot) + '</b></div></div></div>' + hint +
    '<h2>Próximos pagos</h2><div class="list">' + (list.map(it => {
      const paid = it.pagado === occYear(it);
      return '<div class="row">' + chk(paid, 'data-achk', it.id) + '<div class="mon' + (it.a >= 20000 ? ' big' : '') + '">' + MES[it.month - 1].slice(0, 3) + '</div><button class="m" data-edit="anuales:' + it.id + '"><div class="n" style="font-size:14px;font-weight:500">' + esc(it.n) + '</div><div class="c" style="font-size:12px;color:var(--muted)">' + (paid ? 'Pagado ' + occYear(it) : MES[it.month - 1] + ' ' + occYear(it)) + '</div></button><div class="a" style="font-size:15px;font-weight:600;font-variant-numeric:tabular-nums">' + eur(it.a) + '</div></div>';
    }).join('') || '<div class="empty">Pulsa + para añadir un pago anual.</div>') + '</div>' +
    '<div class="sub" style="padding:0 4px">Al marcar un pago como hecho se apunta como gasto en el Registro. El saldo y la aportación de la reserva se ajustan en Apartados.</div>';
}
async function toggleAnual(id) {
  const it = S.anuales.find(x => x.id === id), y = occYear(it), mid = 'a-' + id + '-' + y;
  if (it.pagado === y) { const o = Object.assign({}, it); delete o.pagado; await store.deleteMov(mid); await store.saveItem('anuales', o); return; }
  const t = iso(new Date());
  await store.saveMov({ id: mid, d: t, a: it.a, t: 'gasto', c: 'anual', n: it.n, m: monthKeyOf(t, S.cfg.cycleStart), f: id });
  await store.saveItem('anuales', Object.assign({}, it, { pagado: y }));
}
function openItem(kind, it) {
  const ed = !!it, fj = kind === 'fijos', bg = $('#sheetBg'), sh = $('#sheet');
  const st = ed ? Object.assign({}, it) : { id: newId(), n: '', a: 0, kind: 'fijo', day: 1, month: new Date().getMonth() + 1 };
  const close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const draw = () => {
    sh.innerHTML = '<div style="font-weight:700;font-size:18px">' + (ed ? 'Editar' : 'Nuevo') + (fj ? ' gasto fijo' : ' pago anual') + '</div>' +
      (fj ? '<div class="seg" style="grid-template-columns:1fr 1fr"><button data-k="fijo" class="' + (st.kind !== 'sub' ? 'on' : '') + '">Fijo</button><button data-k="sub" class="' + (st.kind === 'sub' ? 'on' : '') + '">Suscripción</button></div>' : '') +
      '<input class="inp" id="in" placeholder="Nombre" value="' + esc(st.n) + '"><div class="f"><input class="inp" id="ia" type="number" step="0.01" inputmode="decimal" placeholder="Importe €" value="' + (st.a ? st.a / 100 : '') + '">' +
      (fj ? '<input class="inp" id="id" type="number" min="1" max="31" placeholder="Día" value="' + st.day + '">' : '<select class="inp" id="im">' + MES.map((m, i) => '<option value="' + (i + 1) + '"' + (st.month === i + 1 ? ' selected' : '') + '>' + m + '</option>').join('') + '</select>') + '</div>' +
      '<button class="btn" id="sv">Guardar</button>' + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
    sh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { st.n = $('#in').value; st.a = Math.round((parseFloat($('#ia').value) || 0) * 100); st.day = parseInt($('#id').value) || 1; st.kind = b.dataset.k; draw(); });
    $('#cx').onclick = close;
    $('#sv').onclick = async () => {
      const a = Math.round((parseFloat($('#ia').value) || 0) * 100), n = $('#in').value.trim();
      if (!n || !a) { toast('Pon nombre e importe'); return; }
      const out = Object.assign({}, st, { n, a });
      if (fj) out.day = Math.min(31, Math.max(1, parseInt($('#id').value) || 1)); else out.month = parseInt($('#im').value);
      await store.saveItem(kind, out); close(); toast('Guardado');
    };
    const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar?')) { await store.deleteItem(kind, st.id); close(); } };
  };
  bg.onclick = e => { if (e.target === bg) close(); };
  draw(); bg.classList.add('on');
}


/* ------------------------------ deuda y metas ------------------------------ */
const mk = (y, m) => y + '-' + pad(m);
function loanSchedule(c, withPlan) {
  const R = c.rate / 100 / 12, rows = [];
  let bal = c.d0, [y, m] = c.start.split('-').map(Number), interest = 0, fees = 0;
  for (let i = 0; i < 120 && bal > 0; i++) {
    const key = mk(y, m), int = Math.round(bal * R), pay = Math.min(c.cuota, bal + int);
    bal = bal + int - pay; interest += int;
    const dim = new Date(y, m, 0).getDate();
    rows.push({ key, date: new Date(y, m - 1, Math.min(30, dim)), bal, kind: 'cuota' });
    if (withPlan && bal > 0) {
      if (c.extra && key === c.extraMes) { const e = Math.min(c.extra, bal); bal -= e; fees += Math.round(e * c.fee / 100); rows.push({ key, date: new Date(y, m - 1, Math.min(30, dim)), bal, kind: 'extra', a: e }); }
      if (bal > 0 && c.liquida && key === c.liquida) { fees += Math.round(bal * c.fee / 100); rows.push({ key, date: new Date(y, m - 1, Math.min(30, dim)), bal: 0, kind: 'liquida', a: bal, fee: Math.round(bal * c.fee / 100) }); bal = 0; }
    }
    if (++m > 12) { m = 1; y++; }
  }
  return { rows, interest, fees };
}
function debtScenarios() {
  const c = S.cfg.deuda, base = loanSchedule(c, false), plan = loanSchedule(c, true);
  const ah0 = ahorroNow(), mes = apMesOr('ahorro', 0), f = 1 + c.fee / 100;
  let key = null;
  base.rows.forEach((r, i) => { if (!key && r.bal > 0 && ah0 + mes * (i + 1) >= r.bal * f) key = r.key; });
  const ahorro = key ? loanSchedule(Object.assign({}, c, { extra: 0, liquida: key }), true) : null;
  const out = [{ n: 'Solo cuotas', col: 'var(--muted)', sc: base }, { n: 'Tu plan actual', col: 'var(--accent)', sc: plan }];
  if (ahorro) out.push({ n: 'Liquidar con el ahorro', col: '#E08A2B', sc: ahorro });
  return out.map(o => { const l = o.sc.rows[o.sc.rows.length - 1]; return Object.assign(o, { end: l.key, cost: o.sc.interest + o.sc.fees }); });
}
function debtChart() {
  const sc = debtScenarios(), W = 340, H = 190, L = 38, B = 22, T = 8, R = 8, c = S.cfg.deuda;
  const keys = []; { let [y, m] = c.start.split('-').map(Number); const n = Math.max.apply(null, sc.map(o => o.sc.rows.length)); for (let i = 0; i <= n; i++) { keys.push(mk(y, m)); if (++m > 12) { m = 1; y++; } } }
  const X = i => L + (W - L - R) * i / (keys.length - 1), maxV = c.d0, Y = v => T + (H - T - B) * (1 - v / maxV);
  const pts = o => { const by = {}; o.sc.rows.forEach(r => { by[r.key] = r.bal; }); let last = c.d0; return keys.map((k, i) => { if (k in by) last = by[k]; else if (i > 0 && last > 0 && i > o.sc.rows.length) last = 0; return X(i).toFixed(1) + ',' + Y(last).toFixed(1); }).join(' '); };
  let grid = ''; for (let i = 0; i <= 4; i++) { const v = maxV * i / 4; grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)"/><text x="' + (L - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end" font-size="9" fill="var(--muted)">' + Math.round(v / 100000) + 'k</text>'; }
  let xl = ''; keys.forEach((k, i) => { if ((k.endsWith('-01') && !(i > 0 && i < 4 && false)) || (i === 0 && keys.findIndex(q => q.endsWith('-01')) > 4)) xl += '<text x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : 'middle') + '" font-size="9" fill="var(--muted)">' + (i === 0 ? MES[Number(k.split('-')[1]) - 1].slice(0, 3) + ' ' : '') + k.split('-')[0] + '</text>'; });
  const mfmt = k => MES[Number(k.split('-')[1]) - 1].slice(0, 3) + ' ' + k.split('-')[0];
  const base = sc[0].cost;
  return '<div class="card"><div style="font-weight:600">Comparar formas de pagar el coche</div><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Deuda pendiente mes a mes según cada opción">' + grid + xl +
    sc.map(o => '<polyline fill="none" stroke="' + o.col + '" stroke-width="2.4" stroke-linejoin="round" points="' + pts(o) + '"/>').join('') + '</svg>' +
    sc.map(o => '<div style="display:flex;flex-direction:column;gap:2px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:5px;background:' + o.col + ';margin-right:6px"></i><b>' + o.n + '</b></span><span style="margin-left:16px;font-size:13px"><b>' + mfmt(o.end) + '</b> · ' + eur(o.cost) + ' de coste' + (o.cost < base ? ' <b class="pos">(−' + eur(base - o.cost) + ')</b>' : '') + '</span></div>').join('') +
    '<div class="sub" style="margin:0">Coste = intereses + comisión de cancelación. "Liquidar con el ahorro" supone no hacer el pago extra y liquidar en cuanto tu ahorro del coche (con su aportación mensual actual) cubra lo que debes más la comisión.</div></div>';
}
function metaPlan(g) {
  if (!g.hasta) return null;
  const n = new Date(), idx = k => { const [y, m] = k.split('-').map(Number); return y * 12 + m; }, nowI = n.getFullYear() * 12 + n.getMonth() + 1;
  const falta = Math.max(0, g.goal - g.now), late = idx(g.hasta) - nowI, early = g.desde ? idx(g.desde) - nowI : late;
  const per = k => Math.round(falta / Math.max(1, k));
  const f = k => MES[Number(k.split('-')[1]) - 1].slice(0, 3) + ' ' + k.split('-')[0];
  return { falta, late, done: falta === 0, over: late < 0, tope: per(late), ideal: g.desde && early > 0 ? per(early) : null, txt: g.desde && g.desde !== g.hasta ? 'entre ' + f(g.desde) + ' y ' + f(g.hasta) : 'para ' + f(g.hasta) };
}
function viewMetas() {
  const c = S.cfg.deuda, plan = loanSchedule(c, true), base = loanSchedule(c, false), now = new Date();
  const paid = plan.rows.filter(r => r.date <= now && r.kind === 'cuota'), cur = paid.length ? paid[paid.length - 1].bal : c.d0;
  const upcoming = plan.rows.filter(r => r.date > now || (r.kind !== 'cuota' && r.date >= now));
  const dot = '<i></i>', shown = [];
  upcoming.forEach(r => {
    if (r.kind === 'cuota' && shown.some(x => x.kind === 'cuota')) return;
    shown.push(r);
  });
  const lbl = r => r.kind === 'cuota' ? 'Tras la cuota de ' + MES[Number(r.key.split('-')[1]) - 1].slice(0, 3) : r.kind === 'extra' ? MES[Number(r.key.split('-')[1]) - 1].slice(0, 3) + ' · pago extra de ' + eur(r.a) : MES[Number(r.key.split('-')[1]) - 1].slice(0, 3) + ' ' + r.key.split('-')[0] + ' · liquidas con ' + eur(r.a + r.fee);
  const saved = base.interest - plan.interest - plan.fees;
  const ex = c.extra ? Math.round(c.extra * (1 + c.fee / 100)) : 0, pct = ex ? Math.min(100, Math.round(ahorroNow() / ex * 100)) : 0;
  const last = plan.rows[plan.rows.length - 1];
  const metas = S.metas.slice().sort((a, b) => (a.hasta || '9999').localeCompare(b.hasta || '9999'));
  return '<div class="head"><div><h1>Metas</h1><div class="sub">Lo que debes y a dónde vas</div></div></div>' +
    '<div class="hero"><div class="row2"><span class="l">Debes del coche</span><span class="l">' + c.rate.toLocaleString('de-DE') + ' % · cuota ' + eur(c.cuota) + '</span></div><div class="big">' + eur(cur) + '</div><div style="display:flex;flex-direction:column;gap:8px">' +
    shown.map(r => '<div class="step"><i></i><span>' + lbl(r) + '</span><b>' + eur(r.bal) + '</b></div>').join('') + '</div></div>' +
    (saved > 0 ? '<div class="hint">Con este plan terminas de pagar en <b>' + MES[Number(last.key.split('-')[1]) - 1] + ' ' + last.key.split('-')[0] + '</b> y te ahorras unos <b>' + eur(saved) + '</b> entre intereses y comisiones, frente a seguir pagando la cuota hasta el final.</div>' : '') +
    (ex ? '<div class="card"><div class="row2"><b>Ahorro para el pago extra</b><span style="color:var(--muted)">' + MES[Number(c.extraMes.split('-')[1]) - 1].slice(0, 3) + '</span></div><div class="row2" style="align-items:baseline"><span style="font-size:24px;font-weight:700;font-variant-numeric:tabular-nums">' + eur(ahorroNow()) + '</span><span style="color:var(--muted)">de ' + eur(ex) + ' (extra + ' + c.fee + ' % de comisión)</span></div><div class="bar"><i style="width:' + pct + '%"></i></div></div>' : '') +
    debtChart() +
    '<button class="btn sec" id="deuda">Editar plan de la deuda y ahorro</button>' +
    '<h2>Metas</h2>' + (metas.map(g => {
      const p = g.goal ? Math.min(100, Math.round(g.now / g.goal * 100)) : 0, mp = metaPlan(g);
      return '<button class="goal" data-meta="' + g.id + '"><div class="row2"><b>' + esc(g.n) + '</b><span style="color:var(--muted);font-size:12px">' + esc(mp ? mp.txt : g.when || '') + '</span></div><div class="row2" style="align-items:baseline"><span style="font-size:18px;font-weight:700;font-variant-numeric:tabular-nums">' + eur(g.now) + '</span><span style="color:var(--muted)">de ' + eur(g.goal) + '</span></div><div class="bar" style="height:7px"><i style="width:' + p + '%;background:' + (g.color || 'var(--accent)') + '"></i></div>' + (mp ? '<div class="sub" style="margin:0;color:' + (mp.over && !mp.done ? 'var(--neg)' : 'var(--ink)') + '">' + (mp.done ? 'Meta cumplida' : mp.over ? 'La fecha ya pasó: faltan ' + eur(mp.falta) : 'Ahorra <b>' + eur(mp.tope) + '/mes</b>' + (mp.ideal && mp.ideal !== mp.tope ? ' (o ' + eur(mp.ideal) + '/mes si quieres llegar antes)' : '') + ' · faltan ' + eur(mp.falta)) + '</div>' : '') + '</button>';
    }).join('') || '<div class="empty">Pulsa + para añadir una meta.</div>');
}
function openMeta(g) {
  const ed = !!g, st = ed ? Object.assign({}, g) : { id: newId(), n: '', when: '', goal: 0, now: 0, color: '#0B7A6B' };
  const bg = $('#sheetBg'), sh = $('#sheet'), close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">' + (ed ? 'Editar meta' : 'Nueva meta') + '</div><input class="inp" id="mn" placeholder="Nombre" value="' + esc(st.n) + '"><input class="inp" id="mw" placeholder="Nota (opcional)" value="' + esc(st.when) + '"><div class="sub" style="margin:0">Fecha objetivo: pon solo "hasta" si es una fecha concreta, o "desde" y "hasta" si es un rango.</div><div class="f"><input class="inp" id="md" type="month" value="' + (st.desde || '') + '" aria-label="Desde"><input class="inp" id="mh" type="month" value="' + (st.hasta || '') + '" aria-label="Hasta"></div><div class="f"><input class="inp" id="mg" type="number" step="0.01" inputmode="decimal" placeholder="Objetivo €" value="' + (st.goal ? st.goal / 100 : '') + '"><input class="inp" id="mo" type="number" step="0.01" inputmode="decimal" placeholder="Llevas €" value="' + (st.now ? st.now / 100 : '') + '"></div><button class="btn" id="sv">Guardar</button>' + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
  $('#cx').onclick = close;
  $('#sv').onclick = async () => {
    const n = $('#mn').value.trim(), goal = Math.round((parseFloat($('#mg').value) || 0) * 100); if (!n || !goal) { toast('Pon nombre y objetivo'); return; }
    await store.saveItem('metas', Object.assign({}, st, { n, when: $('#mw').value.trim(), goal, now: Math.round((parseFloat($('#mo').value) || 0) * 100), desde: $('#md').value || '', hasta: $('#mh').value || $('#md').value || '' })); close(); toast('Guardado');
  };
  const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar?')) { await store.deleteItem('metas', st.id); close(); } };
  bg.onclick = e => { if (e.target === bg) close(); }; bg.classList.add('on');
}
function openDeuda() {
  const c = S.cfg.deuda, bg = $('#sheetBg'), sh = $('#sheet'), close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const opts = (sel) => { let o = '<option value="">Ninguno</option>', [y, m] = c.start.split('-').map(Number); for (let i = 0; i < 40; i++) { const k = mk(y, m); o += '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + MES[m - 1] + ' ' + y + '</option>'; if (++m > 12) { m = 1; y++; } } return o; };
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">Plan de la deuda</div>' +
    '<div class="set"><span>Pago extra (€)</span><input class="inp" id="dx" type="number" step="1" inputmode="decimal" value="' + (c.extra / 100) + '"></div><div class="set"><span>Mes del pago extra</span><select class="inp" id="dm" style="max-width:170px">' + opts(c.extraMes) + '</select></div><div class="set"><span>Mes en que liquidas</span><select class="inp" id="dl2" style="max-width:170px">' + opts(c.liquida) + '</select></div><div class="set"><span>Comisión de cancelación (%)</span><input class="inp" id="df" type="number" step="0.1" value="' + c.fee + '"></div><div class="set"><span>Ahorro reservado para el extra (€)</span><input class="inp" id="da" type="number" step="0.01" inputmode="decimal" value="' + (ahorroNow() / 100) + '"></div>' +
    '<div class="sub" style="margin:0">Los datos base (deuda inicial, interés y cuota) están en el archivo de configuración; si cambian, avísame.</div><button class="btn" id="sv">Guardar</button><button class="btn sec" id="cx">Cancelar</button>';
  if (apById('ahorro')) { const da = $('#da'); if (da) da.closest('.set').remove(); }
  $('#cx').onclick = close;
  $('#sv').onclick = async () => {
    const d = Object.assign({}, c, { extra: Math.round((parseFloat($('#dx').value) || 0) * 100), extraMes: $('#dm').value, liquida: $('#dl2').value, fee: parseFloat($('#df').value) || 0 });
    await store.saveConfig(Object.assign({}, S.cfg, { deuda: d, ahorroSaldo: $('#da') ? Math.round((parseFloat($('#da').value) || 0) * 100) : S.cfg.ahorroSaldo })); close(); toast('Guardado');
  };
  bg.onclick = e => { if (e.target === bg) close(); }; bg.classList.add('on');
}


/* ------------------------------ viajes, regalos, resumen ------------------------------ */
const TP = { aloj: 'Alojamiento', transp: 'Transporte', comida: 'Comida', activ: 'Actividades', compras: 'Compras', otros: 'Otros' };
const TPCOL = { aloj: '#2A6FDB', transp: '#3B6FB6', comida: '#E08A2B', activ: '#8B5CF6', compras: '#D6547F', otros: '#8A94A6' };
const tripMovs = id => S.all.filter(m => m.v === id && m.t === 'gasto');
const fdFull = s => { const d = new Date(s + 'T00:00:00'); return d.getDate() + ' ' + MES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); };
const tripDates = t => t.a ? (t.b && t.b !== t.a ? fdFull(t.a) + ' – ' + fdFull(t.b) : fdFull(t.a)) : 'Fechas por decidir';
function viewMas() {
  const L = (tab, ic, n, c) => '<button class="link" data-tab="' + tab + '"><div class="dot" style="background:var(--accent);color:var(--accent-ink)">' + svg(ic) + '</div><div class="m"><div class="n">' + n + '</div><div class="c">' + c + '</div></div>' + svg('chev') + '</button>';
  return '<div class="head"><div><h1>Más</h1><div class="sub">Viajes, resumen y ajustes</div></div></div>' +
    L('viajes', 'plane', 'Viajes', S.viajes.length + ' viajes') + L('resumen', 'chart', 'Resumen del año', 'Mes a mes') + L('ajustes', 'cog', 'Ajustes', 'Tema, ciclo, presupuestos y copia');
}
function viewViajes() {
  const list = S.viajes.slice().sort((a, b) => (b.a || '9999').localeCompare(a.a || '9999'));
  return '<div class="head"><div style="display:flex;gap:10px;align-items:center"><button class="gear" data-tab="mas" aria-label="Volver">' + svg('l') + '</button><div><h1>Viajes</h1><div class="sub">Lo que gastas en cada escapada</div></div></div></div>' +
    (list.map(t => {
      const sp = sumA(tripMovs(t.id)), p = t.bud ? Math.min(100, Math.round(sp / t.bud * 100)) : 0;
      return '<button class="goal" data-trip="' + t.id + '"><div class="row2"><b>' + esc(t.n) + '</b><span style="color:var(--muted);font-size:12px">' + tripDates(t) + '</span></div><div class="row2" style="align-items:baseline"><span style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">' + eur(sp) + '</span><span style="color:var(--muted)">' + (t.bud ? 'de ' + eur(t.bud) : 'sin presupuesto') + '</span></div>' + (t.bud ? '<div class="bar" style="height:7px"><i style="width:' + p + '%;background:' + (sp > t.bud ? 'var(--neg)' : 'var(--accent)') + '"></i></div>' : '') + '</button>';
    }).join('') || '<div class="empty">Pulsa + para añadir un viaje.</div>');
}
function viewViaje() {
  const t = S.viajes.find(x => x.id === S.trip); if (!t) { S.trip = null; return viewViajes(); }
  const ms = tripMovs(t.id).sort((a, b) => a.d.localeCompare(b.d)), sp = sumA(ms), by = {};
  ms.forEach(m => by[m.tp || 'otros'] = (by[m.tp || 'otros'] || 0) + m.a);
  const days = t.a && t.b ? Math.round((new Date(t.b) - new Date(t.a)) / 864e5) + 1 : 0;
  return '<div class="head"><div style="display:flex;gap:10px;align-items:center"><button class="gear" data-tab="viajes" aria-label="Volver">' + svg('l') + '</button><div><h1 style="font-size:22px">' + esc(t.n) + '</h1><div class="sub">' + tripDates(t) + '</div></div></div></div>' +
    '<div class="hero"><div class="l">Gastado en el viaje</div><div class="big">' + eur(sp) + '</div>' + (t.bud ? '<div class="bar"><i style="width:' + Math.min(100, Math.round(sp / t.bud * 100)) + '%"></i></div><div class="row2"><span>Presupuesto <b>' + eur(t.bud) + '</b></span><span>' + (t.bud - sp >= 0 ? 'Quedan <b>' + eur(t.bud - sp) + '</b>' : 'Te pasas <b>' + eur(sp - t.bud) + '</b>') + '</span></div>' : '') + (days > 0 && sp ? '<div class="row2"><span>Por día (' + days + ' días)</span><b>' + eur(Math.round(sp / days)) + '</b></div>' : '') + '</div>' +
    (ms.length ? '<h2>Por tipo</h2><div class="card" style="gap:12px">' + Object.keys(by).sort((a, b) => by[b] - by[a]).map(k => '<div class="cat"><div class="t"><span>' + TP[k] + '</span><span>' + eur(by[k]) + '</span></div><div class="bar"><i style="width:' + Math.round(by[k] / sp * 100) + '%;background:' + TPCOL[k] + '"></i></div></div>').join('') + '</div>' : '') +
    '<h2>Gastos del viaje</h2>' + (ms.length ? '<div class="list">' + ms.map(m => '<button class="it" data-id="' + m.id + '"><div class="dot" style="background:' + TPCOL[m.tp || 'otros'] + '">' + ico(m.tp || 'otros', TPIC) + '</div><div class="m"><div class="n">' + esc(m.n) + '</div><div class="c">' + fdate(new Date(m.d + 'T00:00:00')) + ' · ' + TP[m.tp || 'otros'] + '</div></div><div class="a">−' + eur(m.a) + '</div></button>').join('') + '</div>' : '<div class="empty">Aún no hay gastos. Pulsa + y se asignan a este viaje.</div>') +
    '<button class="btn sec" data-etrip="1">Editar viaje</button>';
}
const occOf = (mes, dia) => { const t = new Date(); t.setHours(0, 0, 0, 0); let d = new Date(t.getFullYear(), mes - 1, dia); if (d < t) d = new Date(t.getFullYear() + 1, mes - 1, dia); return d; };
function viewRegalos() {
  const now = new Date(), nowIdx = now.getFullYear() * 12 + now.getMonth() + 1, DAY = 864e5;
  const items = S.regalos.map(r => {
    const o = occOf(r.mes, r.dia), spent = sumA(S.all.filter(m => m.g === r.id && m.t === 'gasto' && new Date(m.d) >= o - 60 * DAY && new Date(m.d) <= +o + 20 * DAY));
    return { r, o, spent, rem: Math.max(0, r.bud - spent) };
  }).sort((a, b) => a.o - b.o);
  const tot = S.regalos.reduce((s, x) => s + x.bud, 0), need = Math.round(tot / 12), saldo = apSaldoOr('regalos', S.cfg.regalosSaldo), mes = apMesOr('regalos', S.cfg.regalosMes);
  let cum = 0, worst = null;
  items.forEach(x => { cum += x.rem; const bal = saldo + mes * Math.max(0, x.o.getFullYear() * 12 + x.o.getMonth() + 1 - nowIdx) - cum; if (!worst || bal < worst.bal) worst = { bal, x }; });
  const hint = !worst ? '' : worst.bal < 0 ? '<div class="hint warn">Con tu aportación actual te faltarán <b>' + eur(-worst.bal) + '</b> para <b>' + esc(worst.x.r.n) + '</b>. Sube la aportación al apartado o ajusta los presupuestos.</div>' : '<div class="hint">El apartado cubre todos los regalos del año. El punto más justo es <b>' + esc(worst.x.r.n) + '</b>: te sobrarían <b>' + eur(worst.bal) + '</b>.</div>';
  return '<div class="head"><div style="display:flex;gap:10px;align-items:center"><button class="gear" data-tab="' + (S.prev || 'apartados') + '" aria-label="Volver">' + svg('l') + '</button><div><h1>Regalos</h1><div class="sub">Calendario de los próximos 12 meses</div></div></div></div>' +
    '<div class="hero"><div class="l">En el apartado de regalos</div><div class="big">' + eur(saldo) + '</div><div class="row2"><div><div class="l">Aportas</div><b>' + eur(mes) + ' / mes</b></div><div><div class="l">Necesitas</div><b>' + eur(need) + ' / mes</b></div><div><div class="l">Total al año</div><b>' + eur(tot) + '</b></div></div></div>' + hint +
    '<h2>Próximos regalos</h2><div class="list">' + (items.map(x => {
      const done = x.spent >= x.r.bud * 0.8 && x.spent > 0;
      return '<button class="it" data-rg="' + x.r.id + '"><div class="mon' + (x.r.bud >= 10000 ? ' big' : '') + '" style="flex:none">' + MES[x.o.getMonth()].slice(0, 3) + '</div><div class="m"><div class="n">' + esc(x.r.n) + '</div><div class="c">' + x.o.getDate() + ' ' + MES[x.o.getMonth()] + ' ' + x.o.getFullYear() + (x.spent ? ' · gastado ' + eur(x.spent) : '') + '</div></div><div class="a ' + (done ? 'pos' : '') + '">' + (done ? '✓ ' : '') + eur(x.r.bud) + '</div></button>';
    }).join('') || '<div class="empty">Pulsa + para añadir un regalo.</div>') + '</div>' +
    '<div class="sub" style="padding:0 4px">Al apuntar un gasto de Regalos puedes elegir para quién es, y aparece aquí como gastado. El saldo y la aportación del apartado se cambian en Apartados.</div>';
}
function viewResumen() {
  const y = S.yr, rows = [];
  for (let m = 1; m <= 12; m++) { const k = y + '-' + pad(m), l = S.all.filter(x => x.m === k); if (l.length) rows.push({ k, m, r: calc(l) }); }
  const T = rows.reduce((t, x) => { t.ing += x.r.ing; t.gas += x.r.gas; t.tras += x.r.tras; t.libre += x.r.libre; return t; }, { ing: 0, gas: 0, tras: 0, libre: 0 });
  const bud = libreBudget(), W = 300, H = 110, bw = rows.length ? Math.min(26, (W - 10) / rows.length - 6) : 20, max = Math.max(bud, ...rows.map(x => x.r.libre), 1) * 1.1;
  const chart = rows.length ? '<svg viewBox="0 0 ' + W + ' ' + (H + 18) + '" style="width:100%"><line x1="0" x2="' + W + '" y1="' + (H - bud / max * H) + '" y2="' + (H - bud / max * H) + '" stroke="var(--muted)" stroke-dasharray="4 3"/>' + rows.map((x, i) => { const h = x.r.libre / max * H, cx = 5 + (i + .5) * ((W - 10) / rows.length); return '<rect x="' + (cx - bw / 2) + '" y="' + (H - h) + '" width="' + bw + '" height="' + h + '" rx="4" fill="' + (x.r.libre > bud ? 'var(--neg)' : 'var(--accent)') + '"/><text x="' + cx + '" y="' + (H + 13) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + MES[x.m - 1].slice(0, 3) + '</text>'; }).join('') + '</svg>' : '';
  const byc = {}; S.all.filter(m => m.m.startsWith(y + '-') && m.t === 'gasto').forEach(m => { const c = catFix(m); byc[c] = (byc[c] || 0) + m.a; });
  const keys = Object.keys(byc).sort((a, b) => byc[b] - byc[a]), tg = T.gas || 1;
  return '<div class="head"><div style="display:flex;gap:10px;align-items:center"><button class="gear" data-tab="mas" aria-label="Volver">' + svg('l') + '</button><div><h1>Resumen</h1><div class="sub">Año ' + y + '</div></div></div><div class="mnav"><button data-yr="-1" aria-label="Año anterior">' + svg('l') + '</button><span>' + y + '</span><button data-yr="1" aria-label="Año siguiente">' + svg('r') + '</button></div></div>' +
    (rows.length ? '<div class="grid2"><div class="stat"><div class="l">Has ingresado</div><div class="v pos">' + eur(T.ing) + '</div></div><div class="stat"><div class="l">Has gastado</div><div class="v">' + eur(T.gas) + '</div></div><div class="stat"><div class="l">Has apartado</div><div class="v">' + eur(T.tras) + '</div></div><div class="stat"><div class="l">Tasa de ahorro</div><div class="v">' + (T.ing ? Math.round(T.tras / T.ing * 100) + ' %' : '–') + '</div></div></div>' +
    '<h2>Gasto libre por ciclo</h2><div class="card">' + chart + '<div class="sub" style="margin:0">La línea es tu presupuesto libre (' + eur(bud) + '). En rojo, los ciclos que lo superan.</div></div>' +
    '<h2>Mes a mes</h2><div class="card" style="padding:8px 12px"><table class="tbl"><tr><th>Ciclo</th><th>Entra</th><th>Gastos</th><th>Aparto</th><th>Queda</th></tr>' + rows.map(x => '<tr><td>' + MES[x.m - 1].slice(0, 3) + '</td><td>' + eur(x.r.ing) + '</td><td>' + eur(x.r.gas) + '</td><td>' + eur(x.r.tras) + '</td><td class="' + (x.r.queda < 0 ? 'neg' : '') + '">' + eur(x.r.queda) + '</td></tr>').join('') + '<tr class="tot"><td>Total</td><td>' + eur(T.ing) + '</td><td>' + eur(T.gas) + '</td><td>' + eur(T.tras) + '</td><td>' + eur(rows.reduce((s, x) => s + x.r.queda, 0)) + '</td></tr></table></div>' +
    '<h2>En qué se va el dinero</h2><div class="card" style="gap:12px">' + keys.map(k => '<div class="cat"><div class="t"><span>' + catOf(k).n + '</span><span>' + eur(byc[k]) + ' · ' + Math.round(byc[k] / tg * 100) + ' %</span></div><div class="bar"><i style="width:' + Math.round(byc[k] / tg * 100) + '%;background:' + catOf(k).col + '"></i></div></div>').join('') + '</div>' : '<div class="empty">No hay movimientos en ' + y + '.</div>');
}
function openForm(kind, it) {
  const ed = !!it, bg = $('#sheetBg'), sh = $('#sheet'), close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const F = kind === 'viajes'
    ? [['n', 'Nombre', 'text'], ['a', 'Desde', 'date'], ['b', 'Hasta', 'date'], ['bud', 'Presupuesto €', 'eur']]
    : [['n', 'Nombre (p. ej. Cumpleaños de Iña)', 'text'], ['mes', 'Mes', 'mes'], ['dia', 'Día', 'int'], ['bud', 'Presupuesto €', 'eur']];
  const st = ed ? it : { id: newId(), n: '', a: '', b: '', bud: 0, mes: new Date().getMonth() + 1, dia: 1 };
  const fld = f => { const v = st[f[0]]; const id = 'ff-' + f[0];
    if (f[2] === 'mes') return '<select class="inp" id="' + id + '">' + MES.map((m, i) => '<option value="' + (i + 1) + '"' + (v === i + 1 ? ' selected' : '') + '>' + m + '</option>').join('') + '</select>';
    if (f[2] === 'eur') return '<input class="inp" id="' + id + '" type="number" step="0.01" inputmode="decimal" placeholder="' + f[1] + '" value="' + (v ? v / 100 : '') + '">';
    if (f[2] === 'int') return '<input class="inp" id="' + id + '" type="number" min="1" max="31" placeholder="' + f[1] + '" value="' + (v || '') + '">';
    return '<div style="font-size:12px;color:var(--muted);padding:0 2px">' + (f[2] === 'date' ? f[1] : '') + '</div><input class="inp" id="' + id + '" type="' + f[2] + '" placeholder="' + f[1] + '" value="' + esc(v || '') + '">'; };
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">' + (ed ? 'Editar' : 'Nuevo') + (kind === 'viajes' ? ' viaje' : ' regalo') + '</div>' + F.map(fld).join('') + '<button class="btn" id="sv">Guardar</button>' + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
  $('#cx').onclick = close;
  $('#sv').onclick = async () => {
    const out = Object.assign({}, st);
    F.forEach(f => { const v = $('#ff-' + f[0]).value; out[f[0]] = f[2] === 'eur' ? Math.round((parseFloat(v) || 0) * 100) : (f[2] === 'mes' || f[2] === 'int') ? parseInt(v) || 1 : v.trim(); });
    if (!out.n) { toast('Pon un nombre'); return; }
    await store.saveItem(kind, out); close(); toast('Guardado');
  };
  const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar? Los gastos ya apuntados se conservan.')) { await store.deleteItem(kind, st.id); if (kind === 'viajes') S.trip = null; close(); render(); } };
  bg.onclick = e => { if (e.target === bg) close(); }; bg.classList.add('on');
}

/* ------------------------------ apartados (pantallas) ------------------------------ */
const KIND_L = { libre: 'Gastos libres', reserva: 'Reservas', ahorro: 'Ahorro e inversión' };
const APCOL = ['#E08A2B', '#8B5CF6', '#2A6FDB', '#D6547F', '#8A94A6', '#E0559B', '#B4691F', '#0B7A6B', '#0E8F7E'];
function viewApartados() {
  const aps = S.apartados.map(x => ({ x, s: saldoOf(x), sp: spentIn(x.id), pd: paidIn(x.id) }));
  const plan = aps.filter(z => z.x.mes > 0), pend = plan.reduce((t, z) => t + (trasIn(z.x.id).length ? 0 : z.x.mes), 0);
  const sumK = k => aps.filter(z => z.x.kind === k).reduce((t, z) => t + z.s, 0);
  const covers = aps.map(z => ({ z, c: coverFor(z.x, z.s) })).filter(q => q.c).map(q => q.c.none
    ? '<div class="hint warn"><b>' + esc(q.z.x.n) + '</b> está en negativo (' + eur(q.z.s) + ') y ningún apartado tiene saldo suficiente para cubrirlo. Ajusta el saldo o mueve dinero en varias partes.</div>'
    : '<div class="hint warn"><b>' + esc(q.z.x.n) + '</b> está en negativo (' + eur(q.z.s) + '). Puedes cubrirlo con <b>' + eur(q.c.a) + '</b> de <b>' + esc(q.c.from.n) + '</b> (saldo ' + eur(q.c.saldo) + '). <button class="chip on" style="margin-left:6px" data-cover="' + q.c.from.id + ':' + q.z.x.id + ':' + q.c.a + '">Mover ' + eur(q.c.a) + '</button></div>').join('');
  const row = z => {
    const x = z.x, p = x.mes ? Math.min(100, Math.round(z.sp / x.mes * 100)) : (z.sp ? 100 : 0);
    const sub = x.kind === 'ahorro' ? 'Este ciclo: ' + eur(z.pd) + ' de ' + eur(x.mes) : 'Este ciclo: ' + eur(z.sp) + ' de ' + eur(x.mes);
    return '<button class="it" data-ap="' + x.id + '"><div class="dot" style="background:' + (x.color || 'var(--accent)') + '">' + ico(x.id) + '</div><div class="m"><div class="n">' + esc(x.n) + '</div><div class="c">' + sub + '</div>' + (x.kind !== 'ahorro' ? '<div class="bar" style="height:5px;margin-top:6px"><i style="width:' + p + '%;background:' + (z.sp > x.mes ? 'var(--neg)' : (x.color || 'var(--accent)')) + '"></i></div>' : '') + '</div><div class="a ' + (z.s < 0 ? 'neg' : '') + '">' + eur(z.s) + '</div></button>';
  };
  const grp = k => { const l = aps.filter(z => z.x.kind === k); return l.length ? '<h2>' + KIND_L[k] + '</h2><div class="list">' + l.map(row).join('') + '</div>' : ''; };
  const aTot = sumA(S.anuales), rTot = S.regalos.reduce((t, x) => t + (x.bud || 0), 0);
  const sub = (tab, ic, n, big, c) => '<button class="stat" data-tab="' + tab + '" style="text-align:left;display:block;width:100%"><div class="l" style="display:flex;gap:6px;align-items:center"><span style="width:18px;height:18px;display:inline-flex">' + svg(ic) + '</span>' + n + '</div><div class="v">' + big + '</div><div class="sub" style="margin:0;font-size:11.5px">' + c + '</div></button>';
  return '<div class="head"><div><h1>Apartados</h1><div class="sub">Tu dinero repartido</div></div>' + mnav() + '</div>' +
    '<div class="grid2">' + sub('anuales', 'cal', 'Gastos anuales', eur(aTot), S.anuales.length + ' pagos · reserva ' + eur(apSaldoOr('anual', S.cfg.reservaSaldo))) + sub('regalos', 'gift', 'Regalos', eur(rTot), S.regalos.length + ' personas · apartado ' + eur(apSaldoOr('regalos', S.cfg.regalosSaldo))) + '</div>' +
    (S.apartados.length ? '<div class="hero"><div class="l">Disponible en apartados</div><div class="big">' + eur(sumK('libre') + sumK('reserva')) + '</div><div class="row2"><div><div class="l">Libres</div><b>' + eur(sumK('libre')) + '</b></div><div><div class="l">Reservas</div><b>' + eur(sumK('reserva')) + '</b></div><div><div class="l">Ahorro</div><b>' + eur(sumK('ahorro')) + '</b></div></div></div>' + covers +
    '<h2>Traspasos del ciclo</h2><div class="list">' + plan.map(z => {
      const ts = trasIn(z.x.id), done = ts.length > 0;
      return '<div class="row">' + chk(done, 'data-tch', z.x.id) + '<div class="m"><div class="n" style="font-size:14px;font-weight:500">' + esc(z.x.n) + '</div><div class="c" style="font-size:12px;color:var(--muted)">' + (done ? 'Traspasado' + (z.pd !== z.x.mes ? ' · previsto ' + eur(z.x.mes) : '') : 'Pendiente de traspasar') + '</div></div><div class="a" style="font-size:15px;font-weight:600;font-variant-numeric:tabular-nums">' + eur(done ? z.pd : z.x.mes) + '</div></div>';
    }).join('') + '</div><div class="sub" style="padding:0 4px">' + (pend ? 'Te falta traspasar <b style="color:var(--ink)">' + eur(pend) + '</b> este ciclo. Toca el círculo, cambia el importe si hace falta y confirma.' : 'Todos los traspasos de este ciclo están hechos.') + '</div>' +
    grp('libre') + grp('reserva') + grp('ahorro') +
    '<button class="btn sec" id="mover">Mover dinero entre apartados</button><div class="sub" style="padding:0 4px">El saldo de cada apartado suma lo traspasado y resta los gastos que pagas desde él. Lo que no gastas se acumula al mes siguiente. Pulsa un apartado para editarlo o ajustar su saldo.</div>' : '<div class="empty">Aún no hay apartados. Importa la carga inicial o pulsa + para crear el primero.</div>');
}
async function toggleTraspaso(id) {
  const x = apById(id), ts = trasIn(id);
  if (ts.length) { if (confirm('¿Quitar el traspaso a ' + x.n + ' de este ciclo?')) { for (const m of ts) await store.deleteMov(m.id); toast('Quitado'); } return; }
  openTraspaso(x);
}
function openTraspaso(x) {
  const bg = $('#sheetBg'), sh = $('#sheet'), close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const [ra, rb] = cycleRange(S.key, S.cfg.cycleStart), t = new Date(); t.setHours(0, 0, 0, 0);
  const d0 = iso(t >= ra && t <= rb ? t : rb);
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">Traspaso a ' + esc(x.n) + '</div><div class="sub" style="margin:0">Previsto este ciclo: <b style="color:var(--ink)">' + eur(x.mes) + '</b>. Si hoy has pasado otra cantidad, cámbiala.</div>' +
    '<div class="f"><input class="inp" id="ta" type="number" step="0.01" inputmode="decimal" value="' + (x.mes / 100) + '"><input class="inp" id="td" type="date" value="' + d0 + '" style="max-width:150px"></div><button class="btn" id="sv">Confirmar traspaso</button><button class="btn sec" id="cx">Cancelar</button>';
  $('#cx').onclick = close;
  $('#sv').onclick = async () => {
    const a = Math.round((parseFloat($('#ta').value) || 0) * 100), d = $('#td').value; if (!a || !d) { toast('Pon importe y fecha'); return; }
    const id = 't-' + x.id + '-' + S.key;
    await store.saveMov({ id: S.all.some(m => m.id === id) ? newId() : id, d, a, t: 'traspaso', c: 'apartado', ap: x.id, n: 'Traspaso a ' + x.n, m: S.key }); close(); toast('Traspasado');
  };
  bg.onclick = e => { if (e.target === bg) close(); }; bg.classList.add('on');
}
async function doMover(from, to, a) {
  const d = iso(new Date());
  await store.saveMov({ id: newId(), d, a, t: 'mover', c: 'mover', n: '', ap: to, from, m: monthKeyOf(d, S.cfg.cycleStart) }); toast('Movido ' + eur(a));
}
function openMover(m) {
  const ed = !!(m && m.id), bg = $('#sheetBg'), sh = $('#sheet'), close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const st = ed ? Object.assign({}, m) : { id: newId(), from: (m && m.from) || (S.apartados[0] || {}).id, ap: (S.apartados[1] || {}).id, a: 0, d: iso(new Date()) };
  const opt = sel => S.apartados.map(x => '<option value="' + x.id + '"' + (sel === x.id ? ' selected' : '') + '>' + esc(x.n) + ' (saldo ' + eur(saldoOf(x)) + ')</option>').join('');
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">Mover dinero entre apartados</div><div class="sub" style="margin:0">No cambia lo que hay en tu cuenta: solo reparte el dinero entre apartados.</div><div class="set"><span>Desde</span><select class="inp" id="mf" style="max-width:220px">' + opt(st.from) + '</select></div><div class="set"><span>Hacia</span><select class="inp" id="mt" style="max-width:220px">' + opt(st.ap) + '</select></div><div class="f"><input class="inp" id="ma" type="number" step="0.01" inputmode="decimal" placeholder="Importe €" value="' + (st.a ? st.a / 100 : '') + '"><input class="inp" id="md" type="date" value="' + st.d + '" style="max-width:150px"></div><button class="btn" id="sv">Mover</button>' + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
  $('#cx').onclick = close;
  $('#sv').onclick = async () => {
    const from = $('#mf').value, to = $('#mt').value, a = Math.round((parseFloat($('#ma').value) || 0) * 100), d = $('#md').value;
    if (!a || !d || from === to) { toast('Elige dos apartados distintos e importe'); return; }
    await store.saveMov(Object.assign({}, st, { from, ap: to, a, d, t: 'mover', c: 'mover', m: monthKeyOf(d, S.cfg.cycleStart) })); close(); toast('Movido');
  };
  const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar este movimiento?')) { await store.deleteMov(st.id); close(); } };
  bg.onclick = e => { if (e.target === bg) close(); }; bg.classList.add('on');
}
function openApartado(x) {
  const ed = !!x, bg = $('#sheetBg'), sh = $('#sheet'), close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  const cur = ed ? saldoOf(x) : 0, st = ed ? Object.assign({}, x) : { id: newId(), n: '', mes: 0, kind: 'libre', color: APCOL[S.apartados.length % APCOL.length] };
  sh.innerHTML = '<div style="font-weight:700;font-size:18px">' + (ed ? 'Editar apartado' : 'Nuevo apartado') + '</div><input class="inp" id="an" placeholder="Nombre" value="' + esc(st.n) + '">' +
    (ed ? '' : '<select class="inp" id="ak"><option value="libre">Gasto libre</option><option value="reserva">Reserva (anuales, regalos…)</option><option value="ahorro">Ahorro / inversión</option></select>') +
    '<div class="set"><span>Aportación mensual (€)<div class="sub" style="margin:0">Lo que tienes que traspasar cada ciclo</div></span><input class="inp" id="am" type="number" step="0.01" inputmode="decimal" value="' + (st.mes / 100) + '"></div>' +
    '<div class="set"><span>' + (ed ? 'Saldo actual (€)' : 'Saldo inicial (€)') + '<div class="sub" style="margin:0">' + (ed ? 'Cámbialo para cuadrar con el banco' : '') + '</div></span><input class="inp" id="as" type="number" step="0.01" inputmode="decimal" value="' + (cur / 100) + '"></div>' +
    '<button class="btn" id="sv">Guardar</button>' + (ed ? '<button class="btn sec" id="mv">Mover dinero desde aquí</button>' : '') + (ed && (x.id === 'anual' || x.id === 'regalos') ? '<button class="btn sec" id="cal">' + (x.id === 'anual' ? 'Ver calendario de anuales' : 'Ver calendario de regalos') + '</button>' : '') + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
  $('#cx').onclick = close;
  $('#sv').onclick = async () => {
    const n = $('#an').value.trim(), mes = Math.round((parseFloat($('#am').value) || 0) * 100), target = Math.round((parseFloat($('#as').value) || 0) * 100);
    if (!n) { toast('Pon un nombre'); return; }
    const out = Object.assign({}, st, { n, mes });
    if (ed) out.saldo0 = (x.saldo0 || 0) + (target - cur); else { out.kind = $('#ak').value; out.saldo0 = target; const y = new Date(); y.setDate(y.getDate() - 1); out.fecha0 = iso(y); }
    await store.saveItem('apartados', out); close(); toast('Guardado');
  };
  const mv = $('#mv'); if (mv) mv.onclick = () => { close(); openMover({ from: x.id }); };
  const cal = $('#cal'); if (cal) cal.onclick = () => { close(); S.prev = 'apartados'; S.tab = x.id === 'anual' ? 'anuales' : 'regalos'; render(); };
  const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar el apartado ' + x.n + '? Los movimientos se conservan, pero dejarán de contar en él.')) { await store.deleteItem('apartados', x.id); close(); } };
  bg.onclick = e => { if (e.target === bg) close(); }; bg.classList.add('on');
}

function once(sub) {
  return new Promise(res => { let u, done = false; u = sub(l => { if (done) return; done = true; res(l); if (u) u(); }); if (done && u) u(); });
}
async function allMovs() {
  // Exporta los meses desde 12 atrás hasta 3 adelante del actual
  const out = []; const base = curKey();
  for (let i = -12; i <= 3; i++) {
    const k = shiftKey(base, i);
    out.push(...await once(cb => store.subscribeMonth(k, cb)));
  }
  return out;
}
/* ------------------------------ datos y arranque ------------------------------ */
function subscribe() {
  if (S.unsubM) S.unsubM();
  S.unsubM = store.subscribeMonth(S.key, list => { S.movs = list; if (S.user) render(); });
}
function start() {
  store.init(u => {
    S.user = u; S.ready = true;
    if (S.unsubM) S.unsubM(); if (S.unsubC) S.unsubC(); if (S.unsubL) S.unsubL.forEach(f => f()); if (S.unsubA) S.unsubA();
    S.unsubM = S.unsubC = S.unsubL = null;
    if (!u) { render(); return; }
    S.unsubC = store.subscribeConfig(cfg => {
      const first = !S.key; S.cfg = cfg;
      if (first) { S.key = curKey(); subscribe(); S.unsubA = store.subscribeAll(l => { S.all = l; if (S.user) render(); }); S.unsubL = ['fijos', 'anuales', 'metas', 'viajes', 'regalos', 'apartados'].map(k => store.subscribeList(k, l => { S[k] = l; if (S.user) render(); })); }
      render();
    });
  }).catch(e => { $('#app').innerHTML = '<div class="login"><div class="sub">Error al iniciar: ' + esc(e.message) + '</div></div>'; });
  render();
}
start();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
