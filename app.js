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
  l: '<path d="M15 18l-6-6 6-6"/>', r: '<path d="M9 18l6-6-6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>'
};
const svg = k => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>';

/* --------------------------------- estado --------------------------------- */
const S = { user: null, cfg: DEFAULT_CFG, tab: 'inicio', key: null, movs: [], filter: 'todos', unsubM: null, unsubC: null, ready: false };

function curKey() { return monthKeyOf(iso(new Date()), S.cfg.cycleStart); }

function calc(movs) {
  const r = { ing: 0, tras: 0, gas: 0, libre: 0, fijos: 0, por: {} };
  movs.forEach(m => {
    const c = catFix(m);
    if (m.t === 'ingreso') r.ing += m.a;
    else if (m.t === 'traspaso') r.tras += m.a;
    else {
      r.gas += m.a;
      if (CATS[c] && CATS[c].libre) { r.libre += m.a; r.por[c] = (r.por[c] || 0) + m.a; }
      if (c === 'fijo') r.fijos += m.a;
    }
  });
  r.queda = r.ing - r.tras - r.gas;
  return r;
}
const libreBudget = () => Object.keys(CATS).filter(k => CATS[k].libre).reduce((s, k) => s + (S.cfg.budgets[k] || 0), 0);

/* --------------------------------- vistas --------------------------------- */
function shell(inner) {
  return '<main id="main">' + inner + '</main>' +
    '<button class="fab" id="fab" aria-label="Añadir" style="' + (S.tab === 'ajustes' ? 'display:none' : '') + '"><svg viewBox="0 0 24 24">' + ICON.plus + '</svg></button>' +
    '<nav class="tabs">' + [['inicio', 'Inicio', 'home'], ['registro', 'Registro', 'list'], ['ajustes', 'Ajustes', 'cog']].map(t =>
      '<button class="tab' + (S.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + svg(t[2]) + t[1] + '</button>').join('') + '</nav>';
}
function mnav() {
  return '<div class="mnav"><button data-m="-1" aria-label="Mes anterior">' + svg('l') + '</button><span>' + label(S.key) + '</span><button data-m="1" aria-label="Mes siguiente">' + svg('r') + '</button></div>';
}
function viewInicio() {
  const r = calc(S.movs), [a, b] = cycleRange(S.key, S.cfg.cycleStart), bud = libreBudget();
  const left = bud - r.libre, today = new Date(); today.setHours(0, 0, 0, 0);
  let days = Math.round((b - today) / 864e5) + 1; const live = today >= a && today <= b;
  const perDay = live && days > 0 ? Math.max(0, left) / days : null;
  const pct = bud ? Math.min(100, Math.round(r.libre / bud * 100)) : 0;
  const cats = Object.keys(CATS).filter(k => CATS[k].libre).map(k => {
    const sp = r.por[k] || 0, bg = S.cfg.budgets[k] || 0, p = bg ? Math.min(100, Math.round(sp / bg * 100)) : (sp ? 100 : 0);
    return '<div class="cat"><div class="t"><span>' + CATS[k].n + '</span><span>' + eur(sp) + ' de ' + eur(bg) + '</span></div><div class="bar"><i style="width:' + p + '%;background:' + (sp > bg ? 'var(--neg)' : CATS[k].col) + '"></i></div></div>';
  }).join('');
  return '<div class="head"><div><h1>Inicio</h1><div class="sub">' + fdate(a) + ' – ' + fdate(b) + '</div></div>' + mnav() + '</div>' +
    '<div class="hero"><div class="l">Te queda para gastos libres</div><div class="big' + (left < 0 ? '" style="color:#FF8A80' : '') + '">' + eur(left) + '</div>' +
    '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="row2"><span>Gastado <b>' + eur(r.libre) + '</b> de ' + eur(bud) + '</span>' + (perDay != null ? '<span><b>' + eur(Math.round(perDay)) + '</b> al día</span>' : '') + '</div></div>' +
    '<div class="grid2"><div class="stat"><div class="l">Entra</div><div class="v pos">' + eur(r.ing) + '</div></div>' +
    '<div class="stat"><div class="l">Sale</div><div class="v">' + eur(r.gas + r.tras) + '</div></div>' +
    '<div class="stat"><div class="l">Queda en cuenta</div><div class="v ' + (r.queda < 0 ? 'neg' : '') + '">' + eur(r.queda) + '</div></div>' +
    '<div class="stat"><div class="l">Traspasos (ahorro)</div><div class="v">' + eur(r.tras) + '</div></div></div>' +
    '<h2>Gastos libres por categoría</h2><div class="card" style="gap:12px">' + cats + '</div>';
}
function viewRegistro() {
  const f = S.filter;
  const items = S.movs.filter(m => f === 'todos' || m.t === f || (f === 'libre' && m.t === 'gasto' && CATS[catFix(m)] && CATS[catFix(m)].libre)).sort((x, y) => y.d.localeCompare(x.d));
  const chips = [['todos', 'Todo'], ['gasto', 'Gastos'], ['libre', 'Libres'], ['ingreso', 'Ingresos'], ['traspaso', 'Traspasos']].map(c =>
    '<button class="chip' + (f === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + c[1] + '</button>').join('');
  let h = '', last = '';
  items.forEach(m => {
    if (m.d !== last) { if (last) h += '</div>'; const d = new Date(m.d + 'T00:00:00'); h += '<div class="day">' + fdate(d) + '</div><div class="list">'; last = m.d; }
    const c = catOf(catFix(m)), sign = m.t === 'ingreso' ? '+' : m.t === 'gasto' ? '−' : '';
    h += '<button class="it" data-id="' + m.id + '"><div class="dot" style="background:' + c.col + '">' + esc(c.n.slice(0, 2)) + '</div><div class="m"><div class="n">' + esc(m.n || c.n) + '</div><div class="c">' + c.n + (m.t === 'traspaso' ? ' · traspaso' : '') + '</div></div><div class="a ' + (m.t === 'ingreso' ? 'pos' : '') + '">' + sign + eur(m.a) + '</div></button>';
  });
  if (last) h += '</div>';
  return '<div class="head"><div><h1>Registro</h1><div class="sub">' + items.length + ' movimientos</div></div>' + mnav() + '</div><div class="chips">' + chips + '</div>' +
    (h || '<div class="empty">Aún no hay movimientos en este ciclo.<br>Pulsa + para añadir el primero.</div>');
}
function viewAjustes() {
  const th = localStorage.getItem('fin-theme') || 'auto';
  const b = S.cfg.budgets, lib = Object.keys(CATS).filter(k => CATS[k].libre);
  return '<div class="head"><div><h1>Ajustes</h1><div class="sub">' + esc(S.user ? S.user.name : '') + '</div></div></div>' +
    (isDemo ? '<div class="banner"><b>Modo demo.</b> Los datos solo se guardan en este navegador. Configura Firebase (ver README) para sincronizar entre dispositivos.</div>' : '') +
    '<div class="card"><div style="font-weight:600">Tema</div><div class="seg" id="theme">' + [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']].map(t => '<button data-th="' + t[0] + '" class="' + (th === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>' +
    '<div class="card"><div style="font-weight:600">Ciclo</div><div class="set"><span>Día en que empieza tu ciclo (cobro)</span><input class="inp" id="cs" type="number" min="1" max="28" value="' + S.cfg.cycleStart + '"></div>' +
    '<div class="sub" style="margin:0">Un movimiento desde ese día cuenta para el mes siguiente.</div></div>' +
    '<div class="card"><div style="font-weight:600">Presupuesto libre por ciclo (€)</div>' + lib.map(k => '<div class="set"><span>' + CATS[k].n + '</span><input class="inp" data-b="' + k + '" type="number" step="1" inputmode="decimal" value="' + ((b[k] || 0) / 100) + '"></div>').join('') +
    '<div class="set"><b>Total</b><b id="btot">' + eur(libreBudget()) + '</b></div></div>' +
    '<button class="btn" id="saveCfg">Guardar ajustes</button>' +
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
  app.innerHTML = shell(S.tab === 'inicio' ? viewInicio() : S.tab === 'registro' ? viewRegistro() : viewAjustes());
  $('#main').scrollTop = keep;
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; render(); });
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { S.key = shiftKey(S.key, +b.dataset.m); subscribe(); render(); });
  app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filter = b.dataset.f; render(); });
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => openSheet(S.movs.find(m => m.id === b.dataset.id)));
  $('#fab').onclick = () => openSheet(null);
  if (S.tab === 'ajustes') bindAjustes();
}
function bindAjustes() {
  document.querySelectorAll('[data-th]').forEach(b => b.onclick = () => {
    const v = b.dataset.th;
    try { v === 'auto' ? localStorage.removeItem('fin-theme') : localStorage.setItem('fin-theme', v); } catch (e) {}
    if (v === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
    render();
  });
  document.querySelectorAll('[data-b]').forEach(i => i.oninput = () => {
    const tot = [...document.querySelectorAll('[data-b]')].reduce((s, x) => s + Math.round((parseFloat(x.value) || 0) * 100), 0);
    $('#btot').textContent = eur(tot);
  });
  $('#saveCfg').onclick = async () => {
    const budgets = {}; document.querySelectorAll('[data-b]').forEach(i => budgets[i.dataset.b] = Math.round((parseFloat(i.value) || 0) * 100));
    const cs = Math.min(28, Math.max(1, parseInt($('#cs').value) || 25));
    await store.saveConfig({ cycleStart: cs, budgets }); toast('Ajustes guardados');
  };
  const o = $('#out'); if (o) o.onclick = () => store.signOut();
  const r = $('#reset'); if (r) r.onclick = () => { if (confirm('¿Restablecer los datos de demo?')) store.resetDemo(); };
}

/* ------------------------- hoja de añadir / editar ------------------------- */
function openSheet(mov) {
  const ed = !!mov;
  const st = { id: ed ? mov.id : newId(), t: ed ? mov.t : 'gasto', c: ed ? catFix(mov) : 'comidas', amt: ed ? String((mov.a / 100).toFixed(2)).replace(/\.00$/, '') : '', d: ed ? mov.d : iso(new Date()), n: ed ? (mov.n || '') : '' };
  const bg = $('#sheetBg'), sh = $('#sheet');
  const draw = () => {
    const a = st.amt === '' ? '0' : st.amt.replace('.', ',');
    sh.innerHTML = '<div class="seg">' + Object.keys(TIPOS).map(t => '<button data-t="' + t + '" class="' + (st.t === t ? 'on' : '') + '">' + TIPOS[t] + '</button>').join('') + '</div>' +
      '<div class="amt">' + a + ' €</div>' +
      '<div class="chips" style="flex-wrap:wrap">' + catsOf(st.t).map(k => '<button class="chip' + (st.c === k ? ' on' : '') + '" data-c="' + k + '">' + CATS[k].n + '</button>').join('') + '</div>' +
      '<div class="f"><input id="sn" placeholder="Concepto (opcional)" value="' + esc(st.n) + '"><input id="sd" type="date" value="' + st.d + '" style="max-width:150px"></div>' +
      '<div class="keys">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map(k => '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>' +
      '<button class="btn" id="sv">' + (ed ? 'Guardar cambios' : 'Añadir') + '</button>' + (ed ? '<button class="btn del" id="dl">Eliminar</button>' : '') + '<button class="btn sec" id="cx">Cancelar</button>';
    sh.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { keepText(); st.t = b.dataset.t; if (CATS[st.c].t !== st.t) st.c = catsOf(st.t)[0]; draw(); });
    sh.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { keepText(); st.c = b.dataset.c; draw(); });
    sh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      keepText(); const k = b.dataset.k;
      if (k === '⌫') st.amt = st.amt.slice(0, -1);
      else if (k === ',') { if (!st.amt.includes('.')) st.amt = (st.amt || '0') + '.'; }
      else { const dec = st.amt.split('.')[1]; if (dec === undefined || dec.length < 2) st.amt = (st.amt === '0' ? '' : st.amt) + k; }
      draw();
    });
    $('#cx').onclick = close;
    $('#sv').onclick = async () => {
      keepText(); const a = Math.round(parseFloat(st.amt || '0') * 100);
      if (!a || a < 0) { toast('Pon un importe'); return; }
      if (!st.d) { toast('Pon una fecha'); return; }
      const m = ed && mov.d === st.d && mov.m ? mov.m : monthKeyOf(st.d, S.cfg.cycleStart);
      const out = { id: st.id, d: st.d, a, t: st.t, c: st.c, n: st.n.trim(), m };
      if (ed && mov.v) out.v = mov.v;
      try { await store.saveMov(out); close(); toast(ed ? 'Guardado' : 'Añadido'); } catch (e) { toast('Error al guardar'); console.error(e); }
    };
    const dl = $('#dl'); if (dl) dl.onclick = async () => { if (confirm('¿Eliminar este movimiento?')) { await store.deleteMov(st.id); close(); toast('Eliminado'); } };
  };
  const keepText = () => { const n = $('#sn'), d = $('#sd'); if (n) st.n = n.value; if (d) st.d = d.value; };
  const close = () => { bg.classList.remove('on'); sh.innerHTML = ''; };
  bg.onclick = e => { if (e.target === bg) close(); };
  draw(); bg.classList.add('on');
}

/* ------------------------------ datos y arranque ------------------------------ */
function subscribe() {
  if (S.unsubM) S.unsubM();
  S.unsubM = store.subscribeMonth(S.key, list => { S.movs = list; if (S.user) render(); });
}
function start() {
  store.init(u => {
    S.user = u; S.ready = true;
    if (S.unsubM) S.unsubM(); if (S.unsubC) S.unsubC();
    S.unsubM = S.unsubC = null;
    if (!u) { render(); return; }
    S.unsubC = store.subscribeConfig(cfg => {
      const first = !S.key; S.cfg = cfg;
      if (first) { S.key = curKey(); subscribe(); }
      render();
    });
  }).catch(e => { $('#app').innerHTML = '<div class="login"><div class="sub">Error al iniciar: ' + esc(e.message) + '</div></div>'; });
  render();
}
start();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
