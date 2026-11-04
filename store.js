// Capa de datos. Con Firebase configurado usa Auth + Firestore; si no, modo demo en localStorage.
import { CONFIG } from './firebase-config.js';

export const isDemo = !CONFIG || !CONFIG.apiKey || String(CONFIG.apiKey).indexOf('PEGA') === 0;

export const DEFAULT_CFG = {
  cycleStart: 25,
  budgets: { comidas: 10000, ocio: 6000, viajes: 8000, ropa: 2000, imprev: 4000 }
};

const V = '10.14.1';
const URLS = {
  app: 'https://www.gstatic.com/firebasejs/' + V + '/firebase-app.js',
  auth: 'https://www.gstatic.com/firebasejs/' + V + '/firebase-auth.js',
  fs: 'https://www.gstatic.com/firebasejs/' + V + '/firebase-firestore.js'
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
export function newId() { return uid(); }

/* ---------------------------------- DEMO ---------------------------------- */
function demoStore() {
  const KEY = 'fin-demo-v1';
  const listeners = { cfg: [], movs: {} };
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.movs) return s; } catch (e) {}
    const s = { cfg: DEFAULT_CFG, movs: seed() };
    save(s); return s;
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function seed() {
    const m = '2026-11';
    const r = (d, a, t, c, n) => ({ id: uid(), d, a: Math.round(a * 100), t, c, n, m });
    return [
      r('2026-10-27', 1770.90, 'ingreso', 'nomina', 'Nómina'),
      r('2026-10-28', 415, 'traspaso', 'ahorro', 'Ahorro para el coche'),
      r('2026-10-28', 100, 'traspaso', 'inversion', 'SP500 (MyInvestor)'),
      r('2026-10-28', 125, 'traspaso', 'reserva', 'Reserva de gastos anuales'),
      r('2026-10-28', 75, 'traspaso', 'regalos', 'Apartado de regalos'),
      r('2026-10-28', 180, 'gasto', 'fijo', 'Ayuda en casa'),
      r('2026-10-28', 80, 'gasto', 'fijo', 'Parking'),
      r('2026-10-30', 105.93, 'gasto', 'anual', 'Seguro moto (empieza el 6 dic)'),
      r('2026-10-30', 33.29, 'gasto', 'regalos', 'Regalo June (Mayoral)'),
      r('2026-10-30', 2.55, 'gasto', 'ocio', 'Coca-Cola con Iña'),
      r('2026-10-31', 280.21, 'gasto', 'fijo', 'Préstamo del coche'),
      r('2026-10-31', 13.13, 'gasto', 'comidas', 'Comida con Vane, Fer e Iña'),
      r('2026-11-01', 15, 'gasto', 'ocio', 'Desayuno Cala Bandida'),
      r('2026-11-01', 6.72, 'gasto', 'comidas', 'Cena McDonald’s con Noe'),
      r('2026-11-01', 5, 'gasto', 'regalos', 'Calcetines de Navidad para Noe')
    ];
  }
  function emit(key) {
    const s = load();
    (listeners.movs[key] || []).forEach(cb => cb(s.movs.filter(x => x.m === key)));
  }
  return {
    async init(onUser) { onUser({ uid: 'demo', name: 'Modo demo', demo: true }); },
    async signIn() {}, async signOut() {},
    subscribeConfig(cb) { listeners.cfg.push(cb); cb(Object.assign({}, DEFAULT_CFG, load().cfg)); return () => { listeners.cfg = listeners.cfg.filter(f => f !== cb); }; },
    subscribeMonth(key, cb) {
      (listeners.movs[key] = listeners.movs[key] || []).push(cb); emit(key);
      return () => { listeners.movs[key] = listeners.movs[key].filter(f => f !== cb); };
    },
    async saveMov(mv) {
      const s = load(); const i = s.movs.findIndex(x => x.id === mv.id);
      const old = i >= 0 ? s.movs[i].m : null;
      if (i >= 0) s.movs[i] = mv; else s.movs.push(mv);
      save(s); emit(mv.m); if (old && old !== mv.m) emit(old);
    },
    async deleteMov(id) {
      const s = load(); const mv = s.movs.find(x => x.id === id);
      s.movs = s.movs.filter(x => x.id !== id); save(s); if (mv) emit(mv.m);
    },
    async saveConfig(cfg) { const s = load(); s.cfg = cfg; save(s); listeners.cfg.forEach(cb => cb(Object.assign({}, DEFAULT_CFG, cfg))); },
    async resetDemo() { localStorage.removeItem(KEY); location.reload(); }
  };
}

/* -------------------------------- FIREBASE -------------------------------- */
function firebaseStore() {
  let A, F, auth, db, user = null;
  const col = () => F.collection(db, 'users', user.uid, 'movs');
  return {
    async init(onUser) {
      const [app, au, fs] = await Promise.all([import(URLS.app), import(URLS.auth), import(URLS.fs)]);
      A = au; F = fs;
      const fbApp = app.initializeApp(CONFIG);
      auth = A.getAuth(fbApp);
      try {
        db = F.initializeFirestore(fbApp, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
      } catch (e) { db = F.getFirestore(fbApp); }
      A.onAuthStateChanged(auth, u => {
        user = u;
        onUser(u ? { uid: u.uid, name: u.displayName || u.email, photo: u.photoURL } : null);
      });
    },
    async signIn() {
      const p = new A.GoogleAuthProvider();
      try { await A.signInWithPopup(auth, p); }
      catch (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) await A.signInWithRedirect(auth, p);
        else throw e;
      }
    },
    async signOut() { await A.signOut(auth); },
    subscribeConfig(cb) {
      const ref = F.doc(db, 'users', user.uid, 'meta', 'config');
      return F.onSnapshot(ref, snap => cb(Object.assign({}, DEFAULT_CFG, snap.exists() ? snap.data() : {})), () => cb(DEFAULT_CFG));
    },
    subscribeMonth(key, cb) {
      const q = F.query(col(), F.where('m', '==', key));
      return F.onSnapshot(q, snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), err => console.error(err));
    },
    async saveMov(mv) { const { id, ...rest } = mv; await F.setDoc(F.doc(db, 'users', user.uid, 'movs', id), rest); },
    async deleteMov(id) { await F.deleteDoc(F.doc(db, 'users', user.uid, 'movs', id)); },
    async saveConfig(cfg) { await F.setDoc(F.doc(db, 'users', user.uid, 'meta', 'config'), cfg); },
    async resetDemo() {}
  };
}

export const store = isDemo ? demoStore() : firebaseStore();
