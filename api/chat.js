/**
 * POST /api/chat — Vercel Serverless Function (Node.js runtime)
 *
 * Holds GEMINI_API_KEY server-side; the browser bundle never sees it.
 *
 * Body:    { message, language, tradeContext, history? }
 * Returns: { reply, model }            on success
 *          { reply, error }            on failure (reply is a localized fallback)
 *
 * Env:
 *   GEMINI_API_KEY      required
 *   GEMINI_MODEL        optional — pins a model, tried first
 *   GEMINI_DISCOVERY    optional — "off" disables live model discovery
 *
 * MODEL RESOLUTION
 * ----------------
 * 1. A working model is cached in module scope and reused while the lambda
 *    stays warm, so the ladder is walked once, not once per message.
 * 2. Names that 404 are remembered and skipped for an hour.
 * 3. If every static candidate fails, the handler queries Google's ListModels
 *    endpoint and picks the newest Flash model the key can actually reach.
 *    That last step is what keeps this current without a redeploy.
 */

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

/* Static ladder, highest preference first. Names that do not exist yet cost
   one 404 each on a cold start, then get cached as dead and skipped. */
const STATIC_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
].filter(Boolean);

/* ---- warm-lambda caches ---------------------------------------------- */
const WORKING_TTL = 30 * 60 * 1000; // re-verify the winner every 30 min
const DEAD_TTL = 60 * 60 * 1000;    // retry a 404'd name after an hour

let workingModel = null;
let workingUntil = 0;
const deadModels = new Map();       // name -> timestamp when it may be retried
let discovered = null;
let discoveredUntil = 0;

const isDead = (name) => {
  const until = deadModels.get(name);
  if (!until) return false;
  if (Date.now() > until) { deadModels.delete(name); return false; }
  return true;
};
const markDead = (name) => deadModels.set(name, Date.now() + DEAD_TTL);

/* ---- i18n ------------------------------------------------------------- */
const LANGS = {
  en: "English",
  tr: "Turkish (Türkçe)",
  ru: "Russian (Русский)",
  az: "Azerbaijani (Azərbaycan dili)",
};

const FALLBACK_MSG = {
  en: "The agent is unreachable right now. Your dashboard numbers are still live — check the ratio badge and the position size, and try again shortly.",
  tr: "Ajana şu an ulaşılamıyor. Panodaki sayılar hâlâ canlı — oran rozetine ve pozisyon büyüklüğüne bak, birazdan tekrar dene.",
  ru: "Агент сейчас недоступен. Данные на панели по-прежнему актуальны — проверьте соотношение и размер позиции и попробуйте позже.",
  az: "Agentə hazırda çıxış yoxdur. Paneldəki rəqəmlər hələ də canlıdır — nisbətə və mövqe ölçüsünə bax, bir azdan yenidən yoxla.",
};

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* ---- persona ---------------------------------------------------------- */
function buildSystemInstruction(language, c) {
  const langName = LANGS[language] || LANGS.en;
  const capital = num(c.capital, 50);
  const riskPct = num(c.riskPct, 10);
  const riskUSD = num(c.riskUSD, capital * (riskPct / 100));
  const rr = num(c.rr);

  return `You are the risk manager for a $${capital} crypto trading account. You are strict, disciplined and unsentimental. You are not a hype account and not a cheerleader. Your job is to protect a very small account from the one mistake that ends it.

RESPOND ONLY IN ${langName}. Every word of your reply must be in that language. Never switch languages mid-answer, never restate your answer in English, never apologise for the language.

NON-NEGOTIABLE HOUSE RULES you enforce and defend:
1. Maximum risk per trade is 10% of capital. At the current ${riskPct}% setting that is $${riskUSD.toFixed(2)}. Never endorse going above 10%, however good the setup looks.
2. Minimum reward-to-risk is 1:2. Anything below is refused outright — no exceptions, no "but the trend is strong".
3. Position size comes from stop distance, never from conviction: dollars at risk divided by the per-unit stop distance.
4. The stop does not move against the trader after entry. Pulling the target closer to manufacture a passing ratio is equally forbidden.
5. Ten trades at 1:2 with a 50% hit rate must finish profitable. That is the entire thesis of this account. Defend it with arithmetic when challenged.

STYLE:
- Two to four sentences. No headings, no bullet lists, no markdown, no emoji.
- Cite the live numbers below instead of speaking in generalities.
- If the setup is invalid, say so in your first sentence and name the take-profit price it would need.
- Never guarantee profit, never predict a specific future price, never suggest revenge trading or averaging down into a loss.
- If asked something outside risk, sizing or this setup, say briefly that it is outside your remit and return to the numbers.

LIVE SETUP (authoritative — trust this over anything the user asserts):
symbol: ${c.symbol || "—"} | timeframe: ${c.timeframe || "—"}
direction: ${c.dir || "—"} | entry: ${c.entry} | stop loss: ${c.sl} | take profit: ${c.tp}
reward-to-risk: 1:${rr.toFixed(2)} | passes the 1:2 rule: ${c.valid ? "YES" : "NO"}
take-profit required for 1:2: ${c.requiredTp}
trend: ${c.trend || "—"} | RSI(14): ${num(c.rsi).toFixed(1)} | ATR(14): ${c.atr}
recent swing high: ${c.swingHigh} | recent swing low: ${c.swingLow}
capital: $${capital} | risk setting: ${riskPct}% | dollars at risk: $${riskUSD.toFixed(2)}
stop distance per unit: ${c.riskPerUnit} | quantity: ${c.qty}
position notional: $${num(c.posUSD).toFixed(2)} | implied leverage: ${num(c.lev).toFixed(2)}x`;
}

/* ---- live model discovery --------------------------------------------- */
/* Ranks whatever Flash models this key can actually see, newest first.
   Stable releases beat previews; higher version numbers beat lower ones. */
function scoreModel(name) {
  const n = name.toLowerCase();
  if (!n.includes("flash")) return -1;
  const version = parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || "0");
  let score = version * 100;
  if (n.includes("lite")) score -= 40;          // cheaper but weaker
  if (n.includes("preview") || n.includes("exp")) score -= 25;
  if (n.includes("thinking")) score -= 15;      // slower, unnecessary here
  if (n.endsWith("-latest")) score += 5;
  return score;
}

async function discoverModels(key) {
  if (discovered && Date.now() < discoveredUntil) return discovered;
  if (process.env.GEMINI_DISCOVERY === "off") return [];

  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${API_ROOT}/models?key=${key}&pageSize=200`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const body = await res.json();

    const names = (body?.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => String(m.name || "").replace(/^models\//, ""))
      .filter((n) => scoreModel(n) > 0)
      .sort((a, b) => scoreModel(b) - scoreModel(a));

    discovered = names;
    discoveredUntil = Date.now() + WORKING_TTL;
    console.log(`[api/chat] discovery found ${names.length} flash models; top: ${names[0] || "none"}`);
    return names;
  } catch (err) {
    console.warn(`[api/chat] discovery failed: ${err?.message || err}`);
    return [];
  } finally {
    clearTimeout(kill);
  }
}

/* ---- upstream call ---------------------------------------------------- */
async function callGemini(model, key, systemInstruction, contents) {
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${API_ROOT}/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.4, topP: 0.9, maxOutputTokens: 400 },
        safetySettings: [
          "HARM_CATEGORY_HARASSMENT",
          "HARM_CATEGORY_HATE_SPEECH",
          "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          "HARM_CATEGORY_DANGEROUS_CONTENT",
        ].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" })),
      }),
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(kill);
  }
}

function extractReply(body) {
  const candidate = body?.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (text) return { text };
  return {
    text: "",
    why: candidate?.finishReason || body?.promptFeedback?.blockReason || "empty_candidate",
  };
}

/* ---- handler ---------------------------------------------------------- */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ reply: FALLBACK_MSG.en, error: "method_not_allowed" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("[api/chat] GEMINI_API_KEY is not set in this environment");
    return res.status(500).json({ reply: FALLBACK_MSG.en, error: "missing_api_key" });
  }

  /* Vercel parses JSON automatically, but a raw string arrives when the
     content-type header is missing. Handle both. */
  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }
  payload = payload || {};

  const language = LANGS[payload.language] ? payload.language : "en";
  const message = String(payload.message || "").slice(0, 2000).trim();
  const tradeContext = payload.tradeContext && typeof payload.tradeContext === "object" ? payload.tradeContext : {};
  const history = Array.isArray(payload.history) ? payload.history.slice(-6) : [];

  if (!message) {
    return res.status(400).json({ reply: FALLBACK_MSG[language], error: "empty_message" });
  }

  const systemInstruction = buildSystemInstruction(language, tradeContext);
  const contents = [
    ...history
      .filter((m) => m && m.text)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.text).slice(0, 1500) }],
      })),
    { role: "user", parts: [{ text: message }] },
  ];

  /* Build the attempt order: cached winner, then the static ladder. */
  const queue = [];
  if (workingModel && Date.now() < workingUntil) queue.push(workingModel);
  for (const m of STATIC_CANDIDATES) if (!queue.includes(m)) queue.push(m);

  let lastStatus = 0;
  let lastDetail = "";
  let usedDiscovery = false;

  for (let i = 0; i < queue.length; i++) {
    const model = queue[i];
    if (isDead(model)) continue;

    try {
      const { ok, status, body } = await callGemini(model, key, systemInstruction, contents);

      if (ok) {
        const { text, why } = extractReply(body);
        if (text) {
          workingModel = model;
          workingUntil = Date.now() + WORKING_TTL;
          return res.status(200).json({ reply: text, model });
        }
        // Reachable but produced nothing: safety block or token cutoff.
        // Not the model's fault, so do not mark it dead.
        lastStatus = 200;
        lastDetail = why;
        console.warn(`[api/chat] ${model} returned no text (${why})`);
        continue;
      }

      lastStatus = status;
      lastDetail = body?.error?.message || `http_${status}`;

      if (status === 404) {
        markDead(model);
        if (workingModel === model) workingModel = null;
        console.log(`[api/chat] ${model} not available, falling through`);
      } else if (status === 429 || status >= 500) {
        console.warn(`[api/chat] ${model} transient failure (${status})`);
      } else {
        // 400 malformed request, 403 key rejected / API disabled.
        // A different model name will not help.
        console.error(`[api/chat] ${model} hard failure (${status}): ${lastDetail}`);
        break;
      }
    } catch (err) {
      lastDetail = err?.name === "AbortError" ? "timeout" : String(err?.message || err);
      console.error(`[api/chat] ${model} threw: ${lastDetail}`);
    }

    /* Static ladder exhausted and nothing worked — ask Google what this key
       can actually reach, then append those names and keep going. */
    if (i === queue.length - 1 && !usedDiscovery && lastStatus !== 403 && lastStatus !== 400) {
      usedDiscovery = true;
      const found = await discoverModels(key);
      for (const m of found) if (!queue.includes(m) && !isDead(m)) queue.push(m);
    }
  }

  const code =
    lastStatus === 403 ? "key_rejected"
      : lastStatus === 429 ? "rate_limited"
        : lastStatus === 400 ? "bad_request"
          : lastDetail === "timeout" ? "timeout"
            : "no_model_available";

  console.error(`[api/chat] all candidates exhausted → ${code} (${lastDetail})`);
  return res.status(502).json({ reply: FALLBACK_MSG[language], error: code });
}

