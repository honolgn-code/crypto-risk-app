import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Globe, Bot, Send, X, TrendingUp, TrendingDown, Shield, Target,
  Activity, Wallet, AlertTriangle, CheckCircle2, RefreshCw, Sparkles,
  Radio, Scale, Loader2, Download, Layers, ChevronRight
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  PALETTE — deep-navy trading desk, cyan instrument light            */
/* ------------------------------------------------------------------ */
const C = {
  void: "#070B14",
  deck: "#0C1220",
  panel: "rgba(20,29,48,0.62)",
  edge: "rgba(120,160,220,0.14)",
  edgeLit: "rgba(34,211,238,0.35)",
  ink: "#E8EEF8",
  inkDim: "#7E8DA6",
  cyan: "#22D3EE",
  mint: "#34D399",
  rose: "#FB7185",
  amber: "#FBBF24",
  violet: "#A78BFA",
};
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

/* ------------------------------------------------------------------ */
/*  I18N — EN / TR / RU / AZ                                           */
/* ------------------------------------------------------------------ */
const I18N = {
  en: {
    app: "RiskDesk", pro: "PRO",
    tagline: "Risk-first signal desk for micro accounts",
    live: "Live Binance", demo: "Offline sample", connecting: "Connecting",
    search: "Search any USDT pair", pairs: "pairs",
    interval: "Timeframe", refresh: "Refresh",
    price: "Price", chg: "24h change", high: "24h high", low: "24h low", vol: "24h volume",
    setup: "Trade setup", long: "LONG", short: "SHORT",
    entry: "Entry", sl: "Stop loss", tp: "Take profit", rr: "Risk / reward",
    valid: "Setup approved", invalid: "Invalid signal",
    invalidMsg: "Insufficient risk/reward ratio. The 1:2 minimum is not met, so this trade is blocked.",
    needTp: "Take profit must reach",
    toPass: "to pass the 1:2 rule.",
    reading: "Market reading", trend: "Trend", rsiL: "RSI (14)", atrL: "ATR (14)",
    struct: "Structure", conf: "Conviction",
    up: "Uptrend", down: "Downtrend", flat: "Ranging",
    capital: "Account capital", riskTrade: "Risk per trade", maxLoss: "Max loss",
    posSize: "Position size", qty: "Quantity", lev: "Leverage needed",
    capped: "Capped at 10% by house rule",
    levWarn: "High leverage. Cut position size or pick a wider stop.",
    levOk: "Within a workable range for this account.",
    ladder: "The 10-trade ladder",
    ladderSub: "Five losses and five wins at 1:2. The math, not the mood, decides the outcome.",
    seqAlt: "Alternating", seqWorst: "Losses first",
    wins: "Wins", losses: "Losses", net: "Ending balance", growth: "Net growth",
    start: "Start", perLoss: "Per loss", perWin: "Per win",
    ai: "Agent", aiTitle: "Trading agent", aiSub: "Reads your live setup before it answers",
    ask: "Ask about this setup…", send: "Send", thinking: "Reading the setup",
    chip1: "Why is the stop loss here?",
    chip2: "What if I risk 5% instead?",
    chip3: "Explain the position size",
    chip4: "Is this setup worth taking?",
    aiLocal: "Local reasoning mode",
    pwa: "PWA files", manifest: "manifest.json", sw: "sw.js",
    footer: "Market data from the public Binance API. Educational tool, not investment advice.",
    err: "Could not reach Binance. Showing an offline sample so you can keep working.",
    loading: "Loading market data",
    noRes: "No pair matches that.",
  },
  tr: {
    app: "RiskDesk", pro: "PRO",
    tagline: "Küçük hesaplar için risk odaklı sinyal masası",
    live: "Binance canlı", demo: "Çevrimdışı örnek", connecting: "Bağlanıyor",
    search: "Herhangi bir USDT paritesi ara", pairs: "parite",
    interval: "Zaman dilimi", refresh: "Yenile",
    price: "Fiyat", chg: "24s değişim", high: "24s yüksek", low: "24s düşük", vol: "24s hacim",
    setup: "İşlem kurulumu", long: "ALIŞ", short: "SATIŞ",
    entry: "Giriş", sl: "Zarar kes", tp: "Kâr al", rr: "Risk / kazanç",
    valid: "Kurulum onaylandı", invalid: "Geçersiz sinyal",
    invalidMsg: "Risk/kazanç oranı yetersiz. 1:2 alt sınırı sağlanmadığı için bu işlem engellendi.",
    needTp: "Kâr al seviyesi",
    toPass: "seviyesine ulaşmalı ki 1:2 kuralı geçilsin.",
    reading: "Piyasa okuması", trend: "Yön", rsiL: "RSI (14)", atrL: "ATR (14)",
    struct: "Yapı", conf: "Güven",
    up: "Yükseliş", down: "Düşüş", flat: "Yatay",
    capital: "Hesap sermayesi", riskTrade: "İşlem başı risk", maxLoss: "Azami zarar",
    posSize: "Pozisyon büyüklüğü", qty: "Miktar", lev: "Gereken kaldıraç",
    capped: "Kural gereği %10 ile sınırlı",
    levWarn: "Kaldıraç yüksek. Pozisyonu küçült veya stopu genişlet.",
    levOk: "Bu hesap için çalışılabilir aralıkta.",
    ladder: "10 işlem merdiveni",
    ladderSub: "1:2 oranıyla beş zarar, beş kâr. Sonucu duygu değil matematik belirler.",
    seqAlt: "Sırayla", seqWorst: "Önce zararlar",
    wins: "Kâr", losses: "Zarar", net: "Bitiş bakiyesi", growth: "Net büyüme",
    start: "Başlangıç", perLoss: "Zarar başına", perWin: "Kâr başına",
    ai: "Ajan", aiTitle: "İşlem ajanı", aiSub: "Cevap vermeden önce canlı kurulumunu okur",
    ask: "Bu kurulumu sor…", send: "Gönder", thinking: "Kurulum okunuyor",
    chip1: "Zarar kes neden burada?",
    chip2: "Riski %5 yaparsam ne olur?",
    chip3: "Pozisyon büyüklüğünü açıkla",
    chip4: "Bu kurulum girilir mi?",
    aiLocal: "Yerel akıl yürütme modu",
    pwa: "PWA dosyaları", manifest: "manifest.json", sw: "sw.js",
    footer: "Veriler halka açık Binance API'sinden. Eğitim amaçlıdır, yatırım tavsiyesi değildir.",
    err: "Binance'a ulaşılamadı. Çalışmaya devam edebilmen için çevrimdışı örnek gösteriliyor.",
    loading: "Piyasa verisi yükleniyor",
    noRes: "Eşleşen parite yok.",
  },
  ru: {
    app: "RiskDesk", pro: "PRO",
    tagline: "Сигнальный терминал для малых счётов, риск на первом месте",
    live: "Binance онлайн", demo: "Офлайн-пример", connecting: "Подключение",
    search: "Найти любую пару к USDT", pairs: "пар",
    interval: "Таймфрейм", refresh: "Обновить",
    price: "Цена", chg: "Изм. 24ч", high: "Максимум 24ч", low: "Минимум 24ч", vol: "Объём 24ч",
    setup: "Сетап сделки", long: "ЛОНГ", short: "ШОРТ",
    entry: "Вход", sl: "Стоп-лосс", tp: "Тейк-профит", rr: "Риск / прибыль",
    valid: "Сетап одобрен", invalid: "Недействительный сигнал",
    invalidMsg: "Соотношение риска и прибыли недостаточно. Минимум 1:2 не выполнен, сделка заблокирована.",
    needTp: "Тейк-профит должен дойти до",
    toPass: "чтобы пройти правило 1:2.",
    reading: "Чтение рынка", trend: "Тренд", rsiL: "RSI (14)", atrL: "ATR (14)",
    struct: "Структура", conf: "Уверенность",
    up: "Восходящий", down: "Нисходящий", flat: "Боковик",
    capital: "Капитал счёта", riskTrade: "Риск на сделку", maxLoss: "Макс. убыток",
    posSize: "Размер позиции", qty: "Количество", lev: "Нужное плечо",
    capped: "Ограничено правилом в 10%",
    levWarn: "Плечо высокое. Уменьшите позицию или расширьте стоп.",
    levOk: "В рабочем диапазоне для этого счёта.",
    ladder: "Лестница из 10 сделок",
    ladderSub: "Пять убытков и пять прибылей при 1:2. Итог решает математика, а не настроение.",
    seqAlt: "По очереди", seqWorst: "Сначала убытки",
    wins: "Прибыли", losses: "Убытки", net: "Итоговый баланс", growth: "Чистый рост",
    start: "Старт", perLoss: "За убыток", perWin: "За прибыль",
    ai: "Агент", aiTitle: "Торговый агент", aiSub: "Читает ваш живой сетап перед ответом",
    ask: "Спросите про этот сетап…", send: "Отправить", thinking: "Читаю сетап",
    chip1: "Почему стоп-лосс именно здесь?",
    chip2: "А если рисковать 5%?",
    chip3: "Объясни размер позиции",
    chip4: "Стоит ли брать этот сетап?",
    aiLocal: "Локальный режим рассуждений",
    pwa: "Файлы PWA", manifest: "manifest.json", sw: "sw.js",
    footer: "Данные из публичного API Binance. Учебный инструмент, не инвестиционная рекомендация.",
    err: "Binance недоступен. Показан офлайн-пример, чтобы вы могли продолжить.",
    loading: "Загрузка рыночных данных",
    noRes: "Пара не найдена.",
  },
  az: {
    app: "RiskDesk", pro: "PRO",
    tagline: "Kiçik hesablar üçün risk önətli siqnal masası",
    live: "Binance canlı", demo: "Oflayn nümunə", connecting: "Qoşulur",
    search: "İstənilən USDT cütünü axtar", pairs: "cüt",
    interval: "Zaman aralığı", refresh: "Yenilə",
    price: "Qiymət", chg: "24s dəyişim", high: "24s maksimum", low: "24s minimum", vol: "24s həcm",
    setup: "Əməliyyat quruluşu", long: "ALIŞ", short: "SATIŞ",
    entry: "Giriş", sl: "Zərəri dayandır", tp: "Qazancı götür", rr: "Risk / qazanc",
    valid: "Quruluş təsdiqləndi", invalid: "Etibarsız siqnal",
    invalidMsg: "Risk/qazanc nisbəti kifayət deyil. 1:2 minimumu ödənmədiyi üçün bu əməliyyat bloklandı.",
    needTp: "Qazanc səviyyəsi",
    toPass: "səviyyəsinə çatmalıdır ki, 1:2 qaydası keçsin.",
    reading: "Bazar oxunuşu", trend: "İstiqamət", rsiL: "RSI (14)", atrL: "ATR (14)",
    struct: "Struktur", conf: "İnam",
    up: "Yüksəliş", down: "Eniş", flat: "Yatay",
    capital: "Hesab kapitalı", riskTrade: "Hər əməliyyata risk", maxLoss: "Maksimum zərər",
    posSize: "Mövqe ölçüsü", qty: "Miqdar", lev: "Lazımi çiyin",
    capped: "Qayda ilə 10% ilə məhdudlaşıb",
    levWarn: "Çiyin yüksəkdir. Mövqeyi kiçilt və ya stopu genişlət.",
    levOk: "Bu hesab üçün işlək aralıqdadır.",
    ladder: "10 əməliyyat nərdivanı",
    ladderSub: "1:2 nisbəti ilə beş zərər, beş qazanc. Nəticəni hiss deyil, riyaziyyat həll edir.",
    seqAlt: "Növbə ilə", seqWorst: "Əvvəl zərərlər",
    wins: "Qazanc", losses: "Zərər", net: "Son balans", growth: "Xalis artım",
    start: "Başlanğıc", perLoss: "Hər zərər", perWin: "Hər qazanc",
    ai: "Agent", aiTitle: "Ticarət agenti", aiSub: "Cavab verməzdən əvvəl canlı quruluşu oxuyur",
    ask: "Bu quruluş barədə soruş…", send: "Göndər", thinking: "Quruluş oxunur",
    chip1: "Stop niyə buradadır?",
    chip2: "Riski 5% etsəm nə olar?",
    chip3: "Mövqe ölçüsünü izah et",
    chip4: "Bu quruluşa girmək olar?",
    aiLocal: "Yerli düşüncə rejimi",
    pwa: "PWA faylları", manifest: "manifest.json", sw: "sw.js",
    footer: "Məlumat açıq Binance API-dandır. Təhsil vasitəsidir, investisiya məsləhəti deyil.",
    err: "Binance-a çıxış olmadı. İşinizi davam etdirmək üçün oflayn nümunə göstərilir.",
    loading: "Bazar məlumatı yüklənir",
    noRes: "Uyğun cüt yoxdur.",
  },
};
const LANGS = [
  { id: "en", label: "English", short: "EN" },
  { id: "tr", label: "Türkçe", short: "TR" },
  { id: "ru", label: "Русский", short: "RU" },
  { id: "az", label: "Azərbaycan", short: "AZ" },
];

/* ------------------------------------------------------------------ */
/*  MATH                                                               */
/* ------------------------------------------------------------------ */
const fmtP = (n) => {
  if (!isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (a >= 1) return n.toFixed(4);
  if (a >= 0.01) return n.toFixed(5);
  if (a >= 0.0001) return n.toFixed(7);
  return n.toPrecision(4);
};
const fmtU = (n) => (isFinite(n) ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—");
const fmtQ = (n) => {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(3);
  return n.toPrecision(4);
};
const fmtVol = (n) => {
  if (!isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

function ema(arr, len) {
  if (!arr.length) return [];
  const k = 2 / (len + 1);
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i - 1] * (1 - k));
  return out;
}
function rsi(closes, len = 14) {
  if (closes.length < len + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= len; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) g += d; else l -= d;
  }
  g /= len; l /= len;
  for (let i = len + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    g = (g * (len - 1) + Math.max(d, 0)) / len;
    l = (l * (len - 1) + Math.max(-d, 0)) / len;
  }
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / l);
}
function atr(candles, len = 14) {
  if (candles.length < 2) return 0;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const p = candles[i - 1], c = candles[i];
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
  }
  const w = trs.slice(-len);
  return w.reduce((a, b) => a + b, 0) / w.length;
}

/* offline sample generator — deterministic per symbol */
function sample(symbol) {
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 31 + symbol.charCodeAt(i)) % 99991;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const base = symbol.startsWith("BTC") ? 64000 : symbol.startsWith("ETH") ? 3100
    : symbol.startsWith("PEPE") || symbol.startsWith("FLOKI") ? 0.0000118
      : symbol.startsWith("SOL") ? 148 : 1.2 + rnd() * 40;
  let p = base;
  const out = [];
  const now = Date.now();
  for (let i = 0; i < 120; i++) {
    const drift = (rnd() - 0.46) * base * 0.012;
    const o = p; p = Math.max(base * 0.4, p + drift);
    const h = Math.max(o, p) * (1 + rnd() * 0.006);
    const l = Math.min(o, p) * (1 - rnd() * 0.006);
    out.push({ t: now - (120 - i) * 3600000, o, h, l, c: p, v: 1000 + rnd() * 9000 });
  }
  return out;
}

const CURATED = ["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","BNBUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","DOGEUSDT","PEPEUSDT","SUIUSDT","APTUSDT","NEARUSDT","FLOKIUSDT","TONUSDT","TRXUSDT","DOTUSDT","MATICUSDT","LTCUSDT","ARBUSDT","OPUSDT","INJUSDT","SEIUSDT","TIAUSDT","WIFUSDT","BONKUSDT","RNDRUSDT","FETUSDT","ATOMUSDT","FILUSDT","ETCUSDT","UNIUSDT","AAVEUSDT","ORDIUSDT","JUPUSDT","STXUSDT","ICPUSDT","HBARUSDT","VETUSDT","ALGOUSDT"];
const BASES = ["https://api.binance.com", "https://data-api.binance.vision", "https://api1.binance.com"];
const TFS = ["15m", "1h", "4h", "1d"];

async function hop(path) {
  let last;
  for (const b of BASES) {
    try {
      const r = await fetch(b + path, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } catch (e) { last = e; }
  }
  throw last || new Error("network");
}

/* ------------------------------------------------------------------ */
/*  SIGNAL ENGINE                                                      */
/* ------------------------------------------------------------------ */
function buildSignal(candles) {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const e20 = ema(closes, 20), e50 = ema(closes, 50);
  const last = closes[closes.length - 1];
  const f = e20[e20.length - 1], s = e50[e50.length - 1];
  const a = atr(candles, 14) || last * 0.01;
  const r = rsi(closes, 14);
  const gap = ((f - s) / s) * 100;

  let dir = "flat";
  if (f > s && last > s) dir = "long";
  else if (f < s && last < s) dir = "short";
  else dir = gap >= 0 ? "long" : "short";

  const win = candles.slice(-40);
  const swingHigh = Math.max(...win.map((c) => c.h));
  const swingLow = Math.min(...win.map((c) => c.l));

  const entry = last;
  let sl, tp;
  if (dir === "long") {
    sl = Math.min(entry - a * 1.5, swingLow - a * 0.15);
    tp = Math.max(swingHigh, entry + a * 2.2);
  } else {
    sl = Math.max(entry + a * 1.5, swingHigh + a * 0.15);
    tp = Math.min(swingLow, entry - a * 2.2);
  }
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  const rr = risk > 0 ? reward / risk : 0;
  const requiredTp = dir === "long" ? entry + risk * 2 : entry - risk * 2;

  let conviction = 40;
  conviction += Math.min(25, Math.abs(gap) * 8);
  conviction += dir === "long" ? (r > 50 && r < 72 ? 18 : r >= 72 ? -6 : 4)
    : (r < 50 && r > 28 ? 18 : r <= 28 ? -6 : 4);
  conviction += rr >= 2 ? 14 : -18;
  conviction = Math.max(8, Math.min(96, Math.round(conviction)));

  return {
    dir, entry, sl, tp, risk, reward, rr, requiredTp, valid: rr >= 2,
    rsi: r, atr: a, ema20: f, ema50: s, gap,
    trend: gap > 0.4 ? "up" : gap < -0.4 ? "down" : "flat",
    swingHigh, swingLow, conviction,
  };
}

/* ------------------------------------------------------------------ */
/*  SHARED SHELL                                                       */
/* ------------------------------------------------------------------ */
const Panel = ({ children, className = "", lit = false, style = {} }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: C.panel,
      border: `1px solid ${lit ? C.edgeLit : C.edge}`,
      backdropFilter: "blur(18px) saturate(140%)",
      WebkitBackdropFilter: "blur(18px) saturate(140%)",
      boxShadow: lit ? `0 0 0 1px rgba(34,211,238,0.06), 0 18px 44px -28px rgba(34,211,238,0.5)` : "0 18px 44px -34px rgba(0,0,0,0.9)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Eyebrow = ({ children, icon: Icon, tint = C.inkDim }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon size={13} style={{ color: tint }} />}
    <span className="text-[10px] font-semibold uppercase" style={{ color: tint, letterSpacing: "0.16em" }}>{children}</span>
  </div>
);

const Stat = ({ label, value, tint = C.ink, sub }) => (
  <div>
    <div className="text-[10px] uppercase mb-1" style={{ color: C.inkDim, letterSpacing: "0.12em" }}>{label}</div>
    <div className="text-[15px] font-semibold tabular-nums leading-tight" style={{ color: tint, fontFamily: MONO }}>{value}</div>
    {sub && <div className="text-[10px] mt-0.5" style={{ color: C.inkDim }}>{sub}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/*  CHART — candles + the risk/reward ribbon (signature element)        */
/* ------------------------------------------------------------------ */
function Chart({ candles, sig }) {
  const W = 800, H = 300, PL = 8, PR = 92, PT = 14, PB = 20;
  const data = candles.slice(-70);
  if (!data.length) return <div style={{ height: 220 }} />;

  const lo = Math.min(...data.map((d) => d.l), sig ? Math.min(sig.sl, sig.tp) : Infinity);
  const hi = Math.max(...data.map((d) => d.h), sig ? Math.max(sig.sl, sig.tp) : -Infinity);
  const pad = (hi - lo) * 0.07 || 1;
  const min = lo - pad, max = hi + pad;
  const y = (p) => PT + ((max - p) / (max - min)) * (H - PT - PB);
  const bw = (W - PL - PR) / data.length;

  const lines = sig ? [
    { p: sig.tp, c: C.mint, k: "TP" },
    { p: sig.entry, c: C.cyan, k: "E" },
    { p: sig.sl, c: C.rose, k: "SL" },
  ] : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block", height: "auto" }} role="img" aria-label="price chart">
      <defs>
        <linearGradient id="rz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.rose} stopOpacity="0.02" />
          <stop offset="100%" stopColor={C.rose} stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="wz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.mint} stopOpacity="0.16" />
          <stop offset="100%" stopColor={C.mint} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* reward + risk ribbons */}
      {sig && (
        <>
          <rect x={PL} y={Math.min(y(sig.tp), y(sig.entry))} width={W - PL - PR}
            height={Math.abs(y(sig.tp) - y(sig.entry))} fill="url(#wz)" />
          <rect x={PL} y={Math.min(y(sig.sl), y(sig.entry))} width={W - PL - PR}
            height={Math.abs(y(sig.sl) - y(sig.entry))} fill="url(#rz)" />
        </>
      )}

      {/* candles */}
      {data.map((d, i) => {
        const cx = PL + i * bw + bw / 2;
        const upC = d.c >= d.o;
        const col = upC ? C.mint : C.rose;
        const top = y(Math.max(d.o, d.c));
        const h = Math.max(1.2, Math.abs(y(d.o) - y(d.c)));
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(d.h)} y2={y(d.l)} stroke={col} strokeWidth="1" opacity="0.55" />
            <rect x={cx - bw * 0.32} y={top} width={bw * 0.64} height={h} fill={col} opacity={upC ? 0.9 : 0.8} rx="0.6" />
          </g>
        );
      })}

      {/* levels */}
      {lines.map((l, i) => (
        <g key={i}>
          <line x1={PL} x2={W - PR} y1={y(l.p)} y2={y(l.p)} stroke={l.c} strokeWidth="1"
            strokeDasharray={l.k === "E" ? "0" : "5 4"} opacity="0.85" />
          <rect x={W - PR + 4} y={y(l.p) - 9} width={80} height={18} rx="4" fill={l.c} opacity="0.14" />
          <text x={W - PR + 10} y={y(l.p) + 4} fill={l.c} fontSize="11" fontFamily={MONO} fontWeight="600">
            {fmtP(l.p)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  LADDER — 10-trade scenario                                         */
/* ------------------------------------------------------------------ */
function Ladder({ t, capital, riskPct, rr }) {
  const [worst, setWorst] = useState(false);
  const risk = capital * (riskPct / 100);
  const reward = risk * Math.max(2, rr || 2);
  const seq = worst
    ? [...Array(5).fill(-1), ...Array(5).fill(1)]
    : [-1, 1, -1, 1, -1, 1, -1, 1, -1, 1];

  let bal = capital;
  const path = seq.map((s, i) => {
    bal += s > 0 ? reward : -risk;
    return { i: i + 1, w: s > 0, bal };
  });
  const end = bal;
  const pct = ((end - capital) / capital) * 100;
  const maxB = Math.max(capital, ...path.map((p) => p.bal));
  const minB = Math.min(capital, ...path.map((p) => p.bal));
  const norm = (v) => ((v - minB) / (maxB - minB || 1)) * 100;

  return (
    <Panel className="p-5" lit>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <Eyebrow icon={Layers} tint={C.cyan}>{t.ladder}</Eyebrow>
          <p className="text-[11px] leading-snug mb-4" style={{ color: C.inkDim, maxWidth: 420 }}>{t.ladderSub}</p>
        </div>
        <button
          onClick={() => setWorst((v) => !v)}
          className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
          style={{ background: worst ? "rgba(251,113,133,0.14)" : "rgba(34,211,238,0.12)", color: worst ? C.rose : C.cyan, border: `1px solid ${worst ? "rgba(251,113,133,0.3)" : "rgba(34,211,238,0.3)"}` }}
        >
          {worst ? t.seqWorst : t.seqAlt}
        </button>
      </div>

      {/* staircase */}
      <div className="flex items-end gap-[3px]" style={{ height: 108 }}>
        {path.map((p) => (
          <div key={p.i} className="flex-1 flex flex-col justify-end items-center gap-1" title={`#${p.i} · ${fmtU(p.bal)}`}>
            <span className="text-[8px] tabular-nums" style={{ color: C.inkDim, fontFamily: MONO }}>{p.bal.toFixed(0)}</span>
            <div
              className="w-full rounded-t-[3px] transition-all duration-500"
              style={{
                height: `${12 + norm(p.bal) * 0.72}%`,
                background: p.w
                  ? `linear-gradient(180deg, ${C.mint} 0%, rgba(52,211,153,0.25) 100%)`
                  : `linear-gradient(180deg, rgba(251,113,133,0.55) 0%, rgba(251,113,133,0.12) 100%)`,
                boxShadow: p.w ? "0 0 14px -4px rgba(52,211,153,0.7)" : "none",
              }}
            />
            <span className="text-[8px] font-bold" style={{ color: p.w ? C.mint : C.rose }}>{p.w ? "W" : "L"}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4" style={{ borderTop: `1px solid ${C.edge}` }}>
        <Stat label={t.start} value={fmtU(capital)} />
        <Stat label={t.losses} value={`−${fmtU(risk * 5).slice(1)}`} tint={C.rose} sub={`5 × ${fmtU(risk)}`} />
        <Stat label={t.wins} value={`+${fmtU(reward * 5).slice(1)}`} tint={C.mint} sub={`5 × ${fmtU(reward)}`} />
        <Stat label={t.net} value={fmtU(end)} tint={C.cyan} sub={`${t.growth} ${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`} />
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  AI AGENT                                                           */
/* ------------------------------------------------------------------ */
function localAnswer(q, ctx, lang) {
  const s = q.toLowerCase();
  const L = {
    en: {
      sl: `The stop sits at ${fmtP(ctx.sl)} because it is 1.5× ATR (${fmtP(ctx.atr)}) beyond the entry and just past the last swing at ${fmtP(ctx.dir === "long" ? ctx.swingLow : ctx.swingHigh)}. Anything tighter and normal noise closes you out; anything wider and the ${fmtU(ctx.riskUSD)} risk cap forces a position too small to matter.`,
      risk: `At ${ctx.riskPct}% you risk ${fmtU(ctx.riskUSD)} per trade. Drop to 5% and the risk halves to ${fmtU(ctx.capital * 0.05)}, position size halves to ${fmtU(ctx.posUSD / 2)}, and ten trades at 1:2 end at ${fmtU(ctx.capital + ctx.capital * 0.05 * 5)} instead of ${fmtU(ctx.capital + ctx.riskUSD * 5)}. Slower growth, and a much longer survival runway.`,
      pos: `Position size comes from the stop distance, not from a gut feeling. Risk ${fmtU(ctx.riskUSD)} ÷ ${fmtP(ctx.riskPerUnit)} per unit = ${fmtQ(ctx.qty)} units, which is ${fmtU(ctx.posUSD)} of exposure and about ${ctx.lev.toFixed(1)}× on ${fmtU(ctx.capital)}.`,
      go: ctx.valid
        ? `The ratio is ${ctx.rr.toFixed(2)}:1, above the 1:2 floor, trend reads ${ctx.trend} and RSI is ${ctx.rsi.toFixed(0)}. It clears the rules. Size it at ${fmtU(ctx.posUSD)} and do not move the stop once you are in.`
        : `No. The ratio is only ${ctx.rr.toFixed(2)}:1 and the floor is 2:1. Take profit would need to reach ${fmtP(ctx.requiredTp)} to qualify. Wait for a tighter stop or a further target.`,
      def: `Current read on ${ctx.symbol}: ${ctx.dir} from ${fmtP(ctx.entry)}, stop ${fmtP(ctx.sl)}, target ${fmtP(ctx.tp)}, ratio ${ctx.rr.toFixed(2)}:1, risk ${fmtU(ctx.riskUSD)}, position ${fmtU(ctx.posUSD)}. Ask me about the stop, the ratio, or the sizing.`,
    },
    tr: {
      sl: `Stop ${fmtP(ctx.sl)} seviyesinde çünkü girişten 1.5× ATR (${fmtP(ctx.atr)}) uzakta ve son ${fmtP(ctx.dir === "long" ? ctx.swingLow : ctx.swingHigh)} dönüş noktasının hemen ötesinde. Daha yakın olsa normal dalgalanma seni dışarı atar; daha uzak olsa ${fmtU(ctx.riskUSD)} risk sınırı pozisyonu anlamsız derecede küçültür.`,
      risk: `%${ctx.riskPct} ile işlem başına ${fmtU(ctx.riskUSD)} riske ediyorsun. %5'e düşürürsen risk ${fmtU(ctx.capital * 0.05)}, pozisyon ${fmtU(ctx.posUSD / 2)} olur ve 1:2 ile on işlem sonunda ${fmtU(ctx.capital + ctx.riskUSD * 5)} yerine ${fmtU(ctx.capital + ctx.capital * 0.05 * 5)} kalır. Büyüme yavaş, ama hesabın ömrü çok daha uzun.`,
      pos: `Pozisyon büyüklüğü hisle değil stop mesafesiyle belirlenir. ${fmtU(ctx.riskUSD)} risk ÷ birim başına ${fmtP(ctx.riskPerUnit)} = ${fmtQ(ctx.qty)} birim, yani ${fmtU(ctx.posUSD)} maruziyet ve ${fmtU(ctx.capital)} üzerinde yaklaşık ${ctx.lev.toFixed(1)}× kaldıraç.`,
      go: ctx.valid
        ? `Oran ${ctx.rr.toFixed(2)}:1, 1:2 tabanının üstünde; yön ${ctx.trend}, RSI ${ctx.rsi.toFixed(0)}. Kuralları geçiyor. ${fmtU(ctx.posUSD)} ile gir ve girdikten sonra stopu oynatma.`
        : `Hayır. Oran sadece ${ctx.rr.toFixed(2)}:1, taban 2:1. Kâr al seviyesinin ${fmtP(ctx.requiredTp)} olması gerekirdi. Daha sıkı bir stop ya da daha uzak bir hedef bekle.`,
      def: `${ctx.symbol} okuması: ${fmtP(ctx.entry)} girişli ${ctx.dir}, stop ${fmtP(ctx.sl)}, hedef ${fmtP(ctx.tp)}, oran ${ctx.rr.toFixed(2)}:1, risk ${fmtU(ctx.riskUSD)}, pozisyon ${fmtU(ctx.posUSD)}. Stop, oran veya büyüklük hakkında sor.`,
    },
    ru: {
      sl: `Стоп на ${fmtP(ctx.sl)}, потому что это 1.5× ATR (${fmtP(ctx.atr)}) от входа и чуть за последним экстремумом ${fmtP(ctx.dir === "long" ? ctx.swingLow : ctx.swingHigh)}. Ближе — вынесет обычным шумом, дальше — лимит риска ${fmtU(ctx.riskUSD)} сожмёт позицию до бессмысленной.`,
      risk: `При ${ctx.riskPct}% вы рискуете ${fmtU(ctx.riskUSD)} на сделку. При 5% риск станет ${fmtU(ctx.capital * 0.05)}, позиция ${fmtU(ctx.posUSD / 2)}, а десять сделок при 1:2 дадут ${fmtU(ctx.capital + ctx.capital * 0.05 * 5)} вместо ${fmtU(ctx.capital + ctx.riskUSD * 5)}. Рост медленнее, запас прочности намного больше.`,
      pos: `Размер позиции считается от дистанции стопа, а не от настроения. ${fmtU(ctx.riskUSD)} ÷ ${fmtP(ctx.riskPerUnit)} за единицу = ${fmtQ(ctx.qty)} единиц, это ${fmtU(ctx.posUSD)} экспозиции и около ${ctx.lev.toFixed(1)}× на ${fmtU(ctx.capital)}.`,
      go: ctx.valid
        ? `Соотношение ${ctx.rr.toFixed(2)}:1, выше порога 2:1, тренд ${ctx.trend}, RSI ${ctx.rsi.toFixed(0)}. Правила пройдены. Объём ${fmtU(ctx.posUSD)}, и не двигайте стоп после входа.`
        : `Нет. Соотношение всего ${ctx.rr.toFixed(2)}:1 при пороге 2:1. Тейк должен быть на ${fmtP(ctx.requiredTp)}. Ждите более узкий стоп или более далёкую цель.`,
      def: `Текущее чтение ${ctx.symbol}: ${ctx.dir} от ${fmtP(ctx.entry)}, стоп ${fmtP(ctx.sl)}, цель ${fmtP(ctx.tp)}, соотношение ${ctx.rr.toFixed(2)}:1, риск ${fmtU(ctx.riskUSD)}, позиция ${fmtU(ctx.posUSD)}. Спросите про стоп, соотношение или объём.`,
    },
    az: {
      sl: `Stop ${fmtP(ctx.sl)} səviyyəsindədir, çünki girişdən 1.5× ATR (${fmtP(ctx.atr)}) aralıdır və son ${fmtP(ctx.dir === "long" ? ctx.swingLow : ctx.swingHigh)} dönüş nöqtəsinin bir az kənarındadır. Daha yaxın olsa adi dalğalanma səni çıxarar; daha uzaq olsa ${fmtU(ctx.riskUSD)} risk həddi mövqeyi mənasız dərəcədə kiçildər.`,
      risk: `${ctx.riskPct}% ilə hər əməliyyatda ${fmtU(ctx.riskUSD)} riskə girirsən. 5%-ə salsan risk ${fmtU(ctx.capital * 0.05)}, mövqe ${fmtU(ctx.posUSD / 2)} olur və 1:2 ilə on əməliyyatdan sonra ${fmtU(ctx.capital + ctx.riskUSD * 5)} yerinə ${fmtU(ctx.capital + ctx.capital * 0.05 * 5)} qalır. Artım yavaş, hesabın ömrü çox uzun.`,
      pos: `Mövqe ölçüsü hisslə deyil, stop məsafəsi ilə hesablanır. ${fmtU(ctx.riskUSD)} ÷ vahid başına ${fmtP(ctx.riskPerUnit)} = ${fmtQ(ctx.qty)} vahid, yəni ${fmtU(ctx.posUSD)} məruzlaşma və ${fmtU(ctx.capital)} üzərində təxminən ${ctx.lev.toFixed(1)}× çiyin.`,
      go: ctx.valid
        ? `Nisbət ${ctx.rr.toFixed(2)}:1, 2:1 həddindən yuxarı; istiqamət ${ctx.trend}, RSI ${ctx.rsi.toFixed(0)}. Qaydalardan keçir. ${fmtU(ctx.posUSD)} ilə gir və girdikdən sonra stopu tərpətmə.`
        : `Xeyr. Nisbət yalnız ${ctx.rr.toFixed(2)}:1, hədd isə 2:1. Qazanc səviyyəsi ${fmtP(ctx.requiredTp)} olmalıydı. Daha sıx stop və ya daha uzaq hədəf gözlə.`,
      def: `${ctx.symbol} oxunuşu: ${fmtP(ctx.entry)} girişli ${ctx.dir}, stop ${fmtP(ctx.sl)}, hədəf ${fmtP(ctx.tp)}, nisbət ${ctx.rr.toFixed(2)}:1, risk ${fmtU(ctx.riskUSD)}, mövqe ${fmtU(ctx.posUSD)}. Stop, nisbət və ya ölçü barədə soruş.`,
    },
  }[lang];

  if (/stop|sl\b|zarar|dayandır|стоп/.test(s)) return L.sl;
  if (/5%|risk|риск|%5/.test(s)) return L.risk;
  if (/size|position|pozisyon|mövqe|размер|объ/.test(s)) return L.pos;
  if (/worth|take|gir|dəyər|стоит|valid|geçer/.test(s)) return L.go;
  return L.def;
}

function Agent({ t, lang, ctx, open, setOpen }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  /* Transport: the browser never sees a key. It posts to our own
     /api/chat route, which holds GEMINI_API_KEY server-side.
     If that route is absent (artifact preview, static host), the widget
     degrades to local reasoning instead of dead-ending. */
  const send = useCallback(async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const history = [...msgs.slice(-6).map((m) => ({ role: m.role, text: m.text }))];
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);

    const ctrl = new AbortController();
    const kill = setTimeout(() => ctrl.abort(), 25000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, language: lang, tradeContext: ctx, history }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`http_${res.status}`);
      const data = await res.json();
      const reply = (data?.reply || "").trim();
      if (!reply) throw new Error("empty_reply");
      setOffline(false);
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setOffline(true);
      setMsgs((m) => [...m, { role: "assistant", text: localAnswer(q, ctx, lang), local: true }]);
    } finally {
      clearTimeout(kill);
      setBusy(false);
    }
  }, [input, busy, msgs, ctx, lang]);

  const chips = [t.chip1, t.chip2, t.chip3, t.chip4];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-2xl font-semibold text-[13px] transition-transform active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${C.violet} 0%, ${C.cyan} 100%)`,
          color: C.void, boxShadow: "0 12px 34px -10px rgba(167,139,250,0.7)",
          display: open ? "none" : "flex",
        }}
        aria-label={t.aiTitle}
      >
        <Bot size={17} /> {t.ai}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: "rgba(3,6,12,0.72)" }} onClick={() => setOpen(false)} />
          <div
            className="relative w-full sm:max-w-md flex flex-col"
            style={{ background: C.deck, borderLeft: `1px solid ${C.edgeLit}`, boxShadow: "-30px 0 70px -30px rgba(0,0,0,0.9)" }}
          >
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${C.edge}` }}>
              <div className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "rgba(167,139,250,0.14)", border: `1px solid rgba(167,139,250,0.3)` }}>
                <Sparkles size={16} style={{ color: C.violet }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold" style={{ color: C.ink }}>{t.aiTitle}</div>
                <div className="text-[10px] truncate" style={{ color: C.inkDim }}>{offline ? t.aiLocal : t.aiSub}</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ color: C.inkDim }} aria-label="close">
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="rounded-xl p-3 text-[12px] leading-relaxed"
                style={{ background: "rgba(34,211,238,0.06)", border: `1px solid ${C.edge}`, color: C.inkDim }}>
                <span style={{ color: C.cyan, fontFamily: MONO }}>{ctx.symbol}</span> · {ctx.dir.toUpperCase()} · {t.rr} {ctx.rr.toFixed(2)}:1 · {t.maxLoss} {fmtU(ctx.riskUSD)}
              </div>
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap"
                    style={m.role === "user"
                      ? { background: "rgba(34,211,238,0.16)", color: C.ink, border: `1px solid rgba(34,211,238,0.28)` }
                      : { background: "rgba(255,255,255,0.045)", color: C.ink, border: `1px solid ${C.edge}` }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-[11px]" style={{ color: C.violet }}>
                  <Loader2 size={13} className="animate-spin" /> {t.thinking}…
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3" style={{ borderTop: `1px solid ${C.edge}` }}>
              <div className="flex gap-2 overflow-x-auto pb-2.5">
                {chips.map((c) => (
                  <button key={c} onClick={() => send(c)} disabled={busy}
                    className="shrink-0 text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}`, color: C.inkDim }}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder={t.ask}
                  className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}`, color: C.ink }}
                />
                <button onClick={() => send()} disabled={busy || !input.trim()}
                  className="grid place-items-center w-11 rounded-xl shrink-0 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`, color: C.void,
                    opacity: busy || !input.trim() ? 0.4 : 1,
                  }} aria-label={t.send}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                               */
/* ------------------------------------------------------------------ */
export default function App() {
  const [lang, setLang] = useState("en");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [tf, setTf] = useState("1h");
  const [universe, setUniverse] = useState(CURATED);
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [candles, setCandles] = useState([]);
  const [ticker, setTicker] = useState(null);
  const [status, setStatus] = useState("boot"); // boot | live | offline
  const [busy, setBusy] = useState(true);
  const [capital, setCapital] = useState(50);
  const [riskPct, setRiskPct] = useState(10);
  const [chatOpen, setChatOpen] = useState(false);

  const t = I18N[lang];

  /* PWA: manifest + service worker, silently skipped in sandboxes */
  useEffect(() => {
    try {
      const icon = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#070B14"/><path d="M96 340l72-84 64 44 72-108 76 96" stroke="#22D3EE" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="380" cy="292" r="20" fill="#34D399"/></svg>`
      );
      const iconUrl = `data:image/svg+xml,${icon}`;
      const mf = {
        name: "RiskDesk Pro — Crypto Risk & Signal Desk",
        short_name: "RiskDesk",
        start_url: ".", scope: ".", display: "standalone", orientation: "portrait",
        background_color: "#070B14", theme_color: "#070B14",
        description: "Risk-first crypto signal dashboard for micro accounts.",
        icons: [
          { src: iconUrl, sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: iconUrl, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(mf)], { type: "application/manifest+json" }));
      let link = document.querySelector('link[rel="manifest"]');
      if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
      link.href = url;
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
      meta.content = "#070B14";
      if ("serviceWorker" in navigator) {
        const sw = `const K='riskdesk-v1';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cl=r.clone();caches.open(K).then(k=>k.put(e.request,cl));return r}).catch(()=>caches.match('./'))))});`;
        navigator.serviceWorker
          .register(URL.createObjectURL(new Blob([sw], { type: "text/javascript" })), { scope: "./" })
          .catch(() => {});
      }
    } catch { /* sandboxed preview */ }
  }, []);

  /* symbol universe */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const rows = await hop("/api/v3/ticker/price");
        if (dead) return;
        const all = rows.map((r) => r.symbol).filter((s) => s.endsWith("USDT") && !/(UP|DOWN|BULL|BEAR)USDT$/.test(s));
        const rest = all.filter((s) => !CURATED.includes(s)).sort();
        setUniverse([...CURATED.filter((s) => all.includes(s)), ...rest]);
      } catch { /* keep curated */ }
    })();
    return () => { dead = true; };
  }, []);

  /* market data */
  const load = useCallback(async (soft = false) => {
    if (!soft) setBusy(true);
    try {
      const [k, tk] = await Promise.all([
        hop(`/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=120`),
        hop(`/api/v3/ticker/24hr?symbol=${symbol}`),
      ]);
      setCandles(k.map((r) => ({ t: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] })));
      setTicker({
        last: +tk.lastPrice, chg: +tk.priceChangePercent,
        high: +tk.highPrice, low: +tk.lowPrice, qv: +tk.quoteVolume,
      });
      setStatus("live");
    } catch {
      const s = sample(symbol);
      setCandles(s);
      const first = s[0].c, last = s[s.length - 1].c;
      setTicker({
        last, chg: ((last - first) / first) * 100,
        high: Math.max(...s.map((d) => d.h)), low: Math.min(...s.map((d) => d.l)),
        qv: s.reduce((a, b) => a + b.v * b.c, 0),
      });
      setStatus("offline");
    } finally { setBusy(false); }
  }, [symbol, tf]);

  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    const id = setInterval(() => load(true), 20000);
    return () => clearInterval(id);
  }, [load]);

  const sig = useMemo(() => buildSignal(candles), [candles]);

  const risk = useMemo(() => {
    const riskUSD = capital * (riskPct / 100);
    if (!sig || !sig.risk) return { riskUSD, qty: 0, posUSD: 0, lev: 0, riskPerUnit: 0 };
    const riskPerUnit = sig.risk;
    const qty = riskUSD / riskPerUnit;
    const posUSD = qty * sig.entry;
    return { riskUSD, qty, posUSD, lev: posUSD / capital, riskPerUnit };
  }, [capital, riskPct, sig]);

  const ctx = useMemo(() => ({
    symbol, timeframe: tf, language: lang,
    dir: sig?.dir ?? "flat", entry: sig?.entry ?? 0, sl: sig?.sl ?? 0, tp: sig?.tp ?? 0,
    rr: sig?.rr ?? 0, valid: !!sig?.valid, requiredTp: sig?.requiredTp ?? 0,
    rsi: sig?.rsi ?? 50, atr: sig?.atr ?? 0, trend: sig?.trend ?? "flat",
    swingHigh: sig?.swingHigh ?? 0, swingLow: sig?.swingLow ?? 0,
    capital, riskPct, riskUSD: risk.riskUSD, qty: risk.qty, posUSD: risk.posUSD,
    lev: risk.lev, riskPerUnit: risk.riskPerUnit,
    rules: { maxRiskPct: 10, minRR: 2 },
  }), [symbol, tf, lang, sig, capital, riskPct, risk]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    const list = q ? universe.filter((s) => s.includes(q)) : universe;
    return list.slice(0, 80);
  }, [query, universe]);

  const dl = (name, content, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; a.click();
  };

  const up = (ticker?.chg ?? 0) >= 0;
  const long = sig?.dir === "long";

  return (
    <div className="min-h-screen w-full" style={{
      background: `radial-gradient(1100px 600px at 12% -8%, rgba(34,211,238,0.10), transparent 60%),
                   radial-gradient(900px 500px at 88% 0%, rgba(167,139,250,0.09), transparent 55%),
                   ${C.void}`,
      color: C.ink,
      fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    }}>
      <div className="mx-auto w-full px-4 py-4 pb-24" style={{ maxWidth: 1160 }}>

        {/* ── HEADER ── */}
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: "rgba(34,211,238,0.1)", border: `1px solid ${C.edgeLit}` }}>
              <Shield size={18} style={{ color: C.cyan }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-[19px] font-bold tracking-tight leading-none">{t.app}</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: C.cyan, color: C.void, letterSpacing: "0.1em" }}>{t.pro}</span>
              </div>
              <p className="text-[10.5px] mt-1 truncate" style={{ color: C.inkDim }}>{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{
                background: status === "live" ? "rgba(52,211,153,0.12)" : status === "offline" ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${status === "live" ? "rgba(52,211,153,0.32)" : status === "offline" ? "rgba(251,191,36,0.32)" : C.edge}`,
                color: status === "live" ? C.mint : status === "offline" ? C.amber : C.inkDim,
              }}>
              <Radio size={11} className={status === "live" ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{status === "live" ? t.live : status === "offline" ? t.demo : t.connecting}</span>
            </div>

            <div className="relative">
              <Globe size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.inkDim }} />
              <select value={lang} onChange={(e) => setLang(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1.5 rounded-lg text-[11px] font-semibold outline-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}`, color: C.ink }}
                aria-label="language">
                {LANGS.map((l) => <option key={l.id} value={l.id} style={{ background: C.deck }}>{l.short}</option>)}
              </select>
            </div>
          </div>
        </header>

        {/* ── SEARCH + TIMEFRAME ── */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.inkDim }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpenList(true); }}
              onFocus={() => setOpenList(true)}
              onBlur={() => setTimeout(() => setOpenList(false), 140)}
              placeholder={`${t.search} · ${universe.length} ${t.pairs}`}
              className="w-full rounded-xl pl-10 pr-24 py-3 text-[13px] outline-none"
              style={{ background: C.panel, border: `1px solid ${C.edge}`, color: C.ink, backdropFilter: "blur(14px)" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold tabular-nums"
              style={{ color: C.cyan, fontFamily: MONO }}>{symbol}</span>

            {openList && (
              <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl overflow-hidden max-h-72 overflow-y-auto"
                style={{ background: C.deck, border: `1px solid ${C.edgeLit}`, boxShadow: "0 24px 60px -20px rgba(0,0,0,0.9)" }}>
                {filtered.length === 0 && <div className="px-4 py-3 text-[12px]" style={{ color: C.inkDim }}>{t.noRes}</div>}
                {filtered.map((s) => (
                  <button key={s}
                    onMouseDown={() => { setSymbol(s); setQuery(""); setOpenList(false); }}
                    className="w-full text-left px-4 py-2.5 text-[12.5px] flex items-center justify-between"
                    style={{ color: s === symbol ? C.cyan : C.ink, background: s === symbol ? "rgba(34,211,238,0.07)" : "transparent", fontFamily: MONO }}>
                    <span>{s.replace("USDT", "")}<span style={{ color: C.inkDim }}> /USDT</span></span>
                    {CURATED.includes(s) && <ChevronRight size={13} style={{ color: C.inkDim }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1.5 p-1 rounded-xl shrink-0" style={{ background: C.panel, border: `1px solid ${C.edge}` }}>
            {TFS.map((x) => (
              <button key={x} onClick={() => setTf(x)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-[11.5px] font-semibold transition-colors"
                style={{ background: tf === x ? "rgba(34,211,238,0.16)" : "transparent", color: tf === x ? C.cyan : C.inkDim, fontFamily: MONO }}>
                {x}
              </button>
            ))}
            <button onClick={() => load(false)} className="px-3 py-2 rounded-lg" style={{ color: C.inkDim }} aria-label={t.refresh}>
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {status === "offline" && (
          <div className="flex items-start gap-2 mb-4 px-3.5 py-2.5 rounded-xl text-[11.5px] leading-snug"
            style={{ background: "rgba(251,191,36,0.08)", border: `1px solid rgba(251,191,36,0.26)`, color: C.amber }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {t.err}
          </div>
        )}

        {/* ── PRICE + CHART ── */}
        <Panel className="p-4 sm:p-5 mb-3">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <Eyebrow icon={Activity}>{symbol} · {tf}</Eyebrow>
              <div className="flex items-baseline gap-3">
                <span className="text-[30px] font-bold tabular-nums leading-none" style={{ fontFamily: MONO }}>
                  {ticker ? fmtP(ticker.last) : "—"}
                </span>
                <span className="flex items-center gap-1 text-[13px] font-semibold tabular-nums"
                  style={{ color: up ? C.mint : C.rose }}>
                  {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {ticker ? `${up ? "+" : ""}${ticker.chg.toFixed(2)}%` : "—"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <Stat label={t.high} value={ticker ? fmtP(ticker.high) : "—"} />
              <Stat label={t.low} value={ticker ? fmtP(ticker.low) : "—"} />
              <Stat label={t.vol} value={ticker ? fmtVol(ticker.qv) : "—"} />
            </div>
          </div>

          {busy && !candles.length
            ? <div className="grid place-items-center text-[12px] gap-2" style={{ height: 220, color: C.inkDim }}>
                <Loader2 size={20} className="animate-spin" style={{ color: C.cyan }} />{t.loading}…
              </div>
            : <Chart candles={candles} sig={sig} />}
        </Panel>

        {/* ── SIGNAL + RISK ── */}
        <div className="grid lg:grid-cols-2 gap-3 mb-3">

          {/* setup */}
          <Panel className="p-5" lit={!!sig?.valid}>
            <div className="flex items-center justify-between mb-4">
              <Eyebrow icon={Target} tint={sig?.valid ? C.mint : C.amber}>{t.setup}</Eyebrow>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: long ? "rgba(52,211,153,0.14)" : "rgba(251,113,133,0.14)",
                  color: long ? C.mint : C.rose,
                  border: `1px solid ${long ? "rgba(52,211,153,0.3)" : "rgba(251,113,133,0.3)"}`,
                  letterSpacing: "0.1em",
                }}>
                {long ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {long ? t.long : t.short}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { l: t.entry, v: sig ? fmtP(sig.entry) : "—", c: C.cyan },
                { l: t.sl, v: sig ? fmtP(sig.sl) : "—", c: C.rose },
                { l: t.tp, v: sig ? fmtP(sig.tp) : "—", c: C.mint },
              ].map((x) => (
                <div key={x.l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.035)", border: `1px solid ${C.edge}` }}>
                  <div className="text-[9.5px] uppercase mb-1.5" style={{ color: C.inkDim, letterSpacing: "0.11em" }}>{x.l}</div>
                  <div className="text-[13.5px] font-bold tabular-nums" style={{ color: x.c, fontFamily: MONO }}>{x.v}</div>
                </div>
              ))}
            </div>

            {/* R:R bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase" style={{ color: C.inkDim, letterSpacing: "0.12em" }}>{t.rr}</span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: sig?.valid ? C.mint : C.amber, fontFamily: MONO }}>
                  1 : {sig ? sig.rr.toFixed(2) : "—"}
                </span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div style={{ width: `${100 / (1 + (sig?.rr || 1))}%`, background: C.rose }} />
                <div style={{ width: `${100 * (sig?.rr || 1) / (1 + (sig?.rr || 1))}%`, background: `linear-gradient(90deg, ${C.mint}, rgba(52,211,153,0.4))` }} />
              </div>
              <div className="relative h-3 mt-1">
                <div className="absolute text-[9px] font-semibold" style={{ left: "33.33%", transform: "translateX(-50%)", color: C.inkDim, fontFamily: MONO }}>
                  1:2 ▲
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl p-3.5"
              style={{
                background: sig?.valid ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)",
                border: `1px solid ${sig?.valid ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.3)"}`,
              }}>
              {sig?.valid
                ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: C.mint }} />
                : <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: C.rose }} />}
              <div>
                <div className="text-[12px] font-bold mb-0.5" style={{ color: sig?.valid ? C.mint : C.rose }}>
                  {sig?.valid ? t.valid : t.invalid}
                </div>
                {!sig?.valid && (
                  <p className="text-[11px] leading-snug" style={{ color: C.inkDim }}>
                    {t.invalidMsg} {t.needTp} <span style={{ color: C.ink, fontFamily: MONO }}>{sig ? fmtP(sig.requiredTp) : "—"}</span> {t.toPass}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${C.edge}` }}>
              <Stat label={t.trend} value={sig ? t[sig.trend] : "—"} tint={sig?.trend === "up" ? C.mint : sig?.trend === "down" ? C.rose : C.amber} />
              <Stat label={t.rsiL} value={sig ? sig.rsi.toFixed(0) : "—"} />
              <Stat label={t.atrL} value={sig ? fmtP(sig.atr) : "—"} />
              <Stat label={t.conf} value={sig ? `${sig.conviction}%` : "—"} tint={C.violet} />
            </div>
          </Panel>

          {/* risk engine */}
          <Panel className="p-5">
            <Eyebrow icon={Wallet} tint={C.violet}>{t.posSize}</Eyebrow>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[9.5px] uppercase mb-1.5" style={{ color: C.inkDim, letterSpacing: "0.11em" }}>{t.capital}</label>
                <div className="flex items-center rounded-xl px-3" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}` }}>
                  <span className="text-[13px] mr-1" style={{ color: C.inkDim, fontFamily: MONO }}>$</span>
                  <input type="number" min="5" step="5" value={capital}
                    onChange={(e) => setCapital(Math.max(5, Number(e.target.value) || 5))}
                    className="w-full bg-transparent py-2.5 text-[15px] font-bold outline-none tabular-nums"
                    style={{ color: C.ink, fontFamily: MONO }} />
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] uppercase mb-1.5" style={{ color: C.inkDim, letterSpacing: "0.11em" }}>
                  {t.riskTrade} · <span style={{ color: C.amber }}>{riskPct}%</span>
                </label>
                <div className="rounded-xl px-3 py-3" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}` }}>
                  <input type="range" min="1" max="10" step="1" value={riskPct}
                    onChange={(e) => setRiskPct(Number(e.target.value))}
                    className="w-full" style={{ accentColor: C.amber }} aria-label={t.riskTrade} />
                </div>
                <p className="text-[9.5px] mt-1" style={{ color: C.inkDim }}>{t.capped}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3.5" style={{ background: "rgba(251,113,133,0.07)", border: `1px solid rgba(251,113,133,0.22)` }}>
                <Stat label={t.maxLoss} value={`−${fmtU(risk.riskUSD).slice(1)}`} tint={C.rose} />
              </div>
              <div className="rounded-xl p-3.5" style={{ background: "rgba(34,211,238,0.07)", border: `1px solid rgba(34,211,238,0.22)` }}>
                <Stat label={t.posSize} value={fmtU(risk.posUSD)} tint={C.cyan} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Stat label={t.qty} value={fmtQ(risk.qty)} sub={symbol.replace("USDT", "")} />
              <Stat label={t.lev} value={`${risk.lev.toFixed(1)}×`} tint={risk.lev > 20 ? C.amber : C.ink} />
            </div>

            <div className="flex items-start gap-2 rounded-xl p-3 text-[11px] leading-snug"
              style={{
                background: risk.lev > 20 ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.035)",
                border: `1px solid ${risk.lev > 20 ? "rgba(251,191,36,0.24)" : C.edge}`,
                color: risk.lev > 20 ? C.amber : C.inkDim,
              }}>
              <Scale size={13} className="shrink-0 mt-0.5" />
              {risk.lev > 20 ? t.levWarn : t.levOk}
            </div>
          </Panel>
        </div>

        {/* ── LADDER ── */}
        <Ladder t={t} capital={capital} riskPct={riskPct} rr={sig?.rr ?? 2} />

        {/* ── FOOTER ── */}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] leading-snug" style={{ color: C.inkDim, maxWidth: 520 }}>{t.footer}</p>
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] uppercase" style={{ color: C.inkDim, letterSpacing: "0.12em" }}>{t.pwa}</span>
            <button onClick={() => dl("manifest.json", JSON.stringify({
              name: "RiskDesk Pro", short_name: "RiskDesk", start_url: "/", scope: "/",
              display: "standalone", orientation: "portrait", background_color: "#070B14",
              theme_color: "#070B14",
              icons: [
                { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
                { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
              ],
            }, null, 2), "application/json")}
              className="flex items-center gap-1.5 text-[10.5px] px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}`, color: C.inkDim }}>
              <Download size={11} /> {t.manifest}
            </button>
            <button onClick={() => dl("sw.js",
              `const K='riskdesk-v1';const CORE=['/','/index.html'];\nself.addEventListener('install',e=>{e.waitUntil(caches.open(K).then(c=>c.addAll(CORE)));self.skipWaiting()});\nself.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==K).map(x=>caches.delete(x)))));self.clients.claim()});\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(e.request.url.includes('api.binance.com')){e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return}e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cl=r.clone();caches.open(K).then(k=>k.put(e.request,cl));return r}).catch(()=>caches.match('/'))))});\n`,
              "text/javascript")}
              className="flex items-center gap-1.5 text-[10.5px] px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.edge}`, color: C.inkDim }}>
              <Download size={11} /> {t.sw}
            </button>
          </div>
        </footer>
      </div>

      <Agent t={t} lang={lang} ctx={ctx} open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}

