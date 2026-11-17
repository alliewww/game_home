const T = window.I18N[document.documentElement.lang] || window.I18N["zh-Hant"];
try { localStorage.setItem("wob-lang", document.documentElement.lang); } catch (e) {}
const TYPES = T.types;
const CATS = T.cats;
const REFLECT = T.reflect;
const TIME_LIMIT = 60;
const PENALTY = 10;
const VERSION = "105.1106.10";
const MOVES = window.MOVES.map(([name, type, cat, power], i) => ({
  name: (window.MOVE_I18N && window.MOVE_I18N[i]) || name,
  type, cat, power
}));
const MONS = window.MONS.map(([id, name, types, moves]) => ({
  id,
  name: (window.MON_I18N && (window.MON_I18N[id] || window.MON_I18N[String(id)])) || name,
  types, moves
}));

const $ = id => document.getElementById(id);
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const spriteUrl = (id, back) => `${SPRITE_ROOT}${back ? "back/" : ""}${id}.png`;
const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#222" stroke-width="5"/><path d="M6 50a44 44 0 0 1 88 0z" fill="#ff4d4d" stroke="#222" stroke-width="5"/><circle cx="50" cy="50" r="13" fill="#fff" stroke="#222" stroke-width="5"/></svg>`);

const state = {
  phase: "idle", score: 0, rounds: 0, streak: 0, maxStreak: 0, timeLeft: TIME_LIMIT, timerRunning: false,
  best: +(localStorage.getItem("wob-best") || 0), round: null, answered: false, animating: false, modalKind: null
};

/* Round generation: pick a random opponent, then physical or special with equal chance
   (if the opponent can learn that category), then a random damaging move of that category it can learn. */
function generateRound(lastId) {
  for (; ;) {
    const mon = rand(MONS);
    if (mon.id === lastId) continue;
    const byCat = [0, 1].map(c => mon.moves.filter(i => MOVES[i].cat === c));
    const cats = [0, 1].filter(c => byCat[c].length);
    const cat = rand(cats);
    return { mon, move: MOVES[rand(byCat[cat])] };
  }
}

const upcoming = [];
const preloaded = [];
function fillUpcoming() {
  while (upcoming.length < 3) {
    const round = generateRound((upcoming.at(-1) || state.round)?.mon.id);
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.src = spriteUrl(round.mon.id, false);
    preloaded.push(im);
    if (preloaded.length > 8) preloaded.shift();
    upcoming.push(round);
  }
}
function takeRound() {
  fillUpcoming();
  const round = upcoming.shift();
  fillUpcoming();
  return round;
}

function cropSprite(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  let pixels;
  try { pixels = ctx.getImageData(0, 0, w, h).data; }
  catch { return null; }
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] < 16) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (right < 0) return null;
  left = Math.max(0, left - 1);
  top = Math.max(0, top - 1);
  right = Math.min(w - 1, right + 1);
  bottom = Math.min(h - 1, bottom + 1);
  const cw = right - left + 1, ch = bottom - top + 1;
  if (cw === w && ch === h) return null;
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;
  octx.drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
  return out.toDataURL("image/png");
}
function setSprite(img, urls) {
  const list = (Array.isArray(urls) ? urls : [urls]).slice();
  const token = (img._spriteToken = (img._spriteToken || 0) + 1);
  img.classList.remove("loaded");
  img.crossOrigin = "anonymous";
  const show = () => {
    if (img._spriteToken !== token) return;
    const url = list.shift();
    if (!url) {
      img.onload = img.onerror = null;
      img.src = FALLBACK;
      img.classList.add("loaded");
      return;
    }
    img.onload = () => {
      if (img._spriteToken !== token) return;
      if (!img.naturalWidth) { show(); return; }
      if (!img.dataset.trimmed) {
        const cropped = cropSprite(img);
        if (cropped) {
          img.dataset.trimmed = "1";
          img.src = cropped;
          return;
        }
      }
      img.classList.add("loaded");
    };
    img.onerror = () => show();
    img.dataset.trimmed = "";
    img.src = url;
  };
  show();
}
function spriteReady(img, ms) {
  return new Promise(r => {
    if (img.classList.contains("loaded")) return r();
    const t = setTimeout(r, ms);
    img.addEventListener("load", () => { clearTimeout(t); r(); }, { once: true });
  });
}

function renderStats() {
  $("score").textContent = state.score; $("rounds").textContent = state.rounds; $("best").textContent = state.best;
  renderTime();
}
function renderTime() {
  const low = state.phase === "playing" && state.timeLeft <= 10;
  $("time").textContent = state.timeLeft.toFixed(1);
  $("timeStat").classList.toggle("low", low);
  $("timebar").classList.toggle("low", low);
  $("timebar").classList.toggle("paused", state.phase === "playing" && !state.timerRunning);
  $("timeFill").style.transform = `scaleX(${state.timeLeft / TIME_LIMIT})`;
}
let lastTick = performance.now();
let catchUp = false;
let windowBlurred = false;
let bgClock = 0;

function pageAway() {
  return document.hidden || windowBlurred;
}
function advanceClock(now) {
  let elapsed = now - lastTick;
  // A focused, visible tab still ignores a single long hitch. Switching windows
  // stops rAF, so that gap is real time — including the frame after you return.
  const away = pageAway();
  if (!away && !catchUp && elapsed > 250) elapsed = 250;
  if (!away) catchUp = false;
  lastTick = now;
  const dt = Math.max(0, elapsed) / 1000;
  if (dt > 0 && state.phase === "playing" && state.timerRunning) {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    if (state.timeLeft === 0) timeUp();
  }
  renderTime();
}
function tick(now) {
  advanceClock(now);
  requestAnimationFrame(tick);
}
function syncBackgroundClock() {
  clearInterval(bgClock);
  bgClock = 0;
  if (!pageAway()) return;
  catchUp = true;
  // Background timers are throttled; the timestamp delta still matches wall time.
  bgClock = setInterval(() => advanceClock(performance.now()), 1000);
}
document.addEventListener("visibilitychange", syncBackgroundClock);
window.addEventListener("blur", () => { windowBlurred = true; syncBackgroundClock(); });
window.addEventListener("focus", () => { windowBlurred = false; syncBackgroundClock(); });

function centerIn(el) {
  const s = $("scene").getBoundingClientRect(), r = el.getBoundingClientRect();
  return [r.left + r.width / 2 - s.left, r.top + r.height * .45 - s.top];
}
function fly(cls, fromEl, toEl, ms) {
  const orb = document.createElement("div");
  orb.className = "orb " + cls;
  $("scene").appendChild(orb);
  const [x0, y0] = centerIn(fromEl), [x1, y1] = centerIn(toEl);
  const anim = orb.animate([
    { left: x0 + "px", top: y0 + "px", transform: "scale(.4)", opacity: 0 },
    { opacity: 1, offset: .15 },
    { left: x1 + "px", top: y1 + "px", transform: "scale(1.15)", opacity: 1 }
  ], { duration: ms, easing: "cubic-bezier(.5,0,.8,.6)" });
  return { anim, done: anim.finished.then(() => orb.remove(), () => orb.remove()), orb };
}
function shake(el, color) {
  const img = el.querySelector("img");
  img.animate([
    { transform: "translateX(0)", filter: "drop-shadow(0 2px 0 rgba(0,0,0,.35))" },
    { transform: "translateX(-8px)", filter: `drop-shadow(0 0 14px ${color}) brightness(1.6)` },
    { transform: "translateX(8px)" },
    { transform: "translateX(-5px)", filter: `drop-shadow(0 0 14px ${color}) brightness(1.6)` },
    { transform: "translateX(0)", filter: "drop-shadow(0 2px 0 rgba(0,0,0,.35))" }
  ], { duration: 420 });
}

let enc = null;
function skipEncounter() { if (enc && !enc.done) { enc.skipped = true; enc.wake?.(); } }
function sleeper(e) {
  return ms => new Promise(r => {
    if (e.skipped || e.cancelled) return r(false);
    const t = setTimeout(() => { e.wake = null; r(true); }, ms);
    e.wake = () => { clearTimeout(t); e.wake = null; r(false); };
  });
}

function newRound() {
  closeModal();
  if (enc) { enc.cancelled = true; enc.wake?.(); }
  const round = takeRound();
  state.round = round;
  state.answered = false;
  state.animating = true;
  const e = enc = { done: false, skipped: false, cancelled: false, wake: null };
  const reduce = reduceMotion();
  const sleep = sleeper(e);
  const game = $("game"), dialog = $("dialog");
  const text = T.incoming(round.mon.name, round.move.name);
  const setText = n => {
    const prefix = T.incomingPrefix(round.mon.name);
    const shown = text.slice(0, n);
    $("dialogText").innerHTML = shown.length <= prefix.length ? shown
      : prefix + `<span class="mv">${shown.slice(prefix.length, prefix.length + round.move.name.length)}</span>` + shown.slice(prefix.length + round.move.name.length);
  };
  const finish = () => {
    if (e.cancelled) return;
    game.classList.add("s-dialog");
    game.classList.remove("enc", "wait", "revealed");
    setText(text.length);
    dialog.classList.add("done");
    e.done = true;
    state.animating = false;
    state.timerRunning = state.phase === "playing";
  };
  (async () => {
    game.classList.add("wait");
    game.classList.remove("revealed");
    document.querySelectorAll(".choice").forEach(b => { b.disabled = false; b.classList.remove("correct", "wrong"); });
    dialog.classList.remove("done");
    if (!reduce && !game.classList.contains("enc")) {
      game.classList.add("enc");
      if (!await sleep(420)) return finish();
    }
    game.classList.add("no-trans", "enc");
    game.classList.remove("s-dialog");
    $("dialogText").textContent = "";
    $("foeName").textContent = round.mon.name;
    $("foeId").textContent = "No." + String(round.mon.id).padStart(4, "0");
    $("foeTypes").innerHTML = round.mon.types.map(t => `<span class="type t-${t}">${TYPES[t]}</span>`).join("");
    setSprite($("foeImg"), spriteUrl(round.mon.id, false));
    void game.offsetWidth;
    game.classList.remove("no-trans");
    await Promise.race([spriteReady($("foeImg"), 2500), new Promise(r => { e.wake = r; })]);
    e.wake = null;
    if (e.cancelled) return;
    if (e.skipped || reduce) return finish();
    game.classList.remove("enc");
    if (!await sleep(480)) return finish();
    game.classList.add("s-dialog");
    for (let i = 1; i <= text.length; i++) {
      setText(i);
      if (!await sleep(32)) return finish();
    }
    finish();
  })();
}

function closeModal() {
  clearTimeout(state.modalTimer);
  state.modalKind = null;
  $("modal").classList.remove("show", "cover");
  document.querySelector(".app")?.classList.remove("cover-hidden");
  document.querySelector(".app")?.removeAttribute("inert");
}
function showModal(kind, cls, html, btnId, onClick, delay = 0) {
  const sheet = $("sheet");
  const cover = kind === "start";
  $("modal").classList.toggle("cover", cover);
  document.querySelector(".app")?.classList.toggle("cover-hidden", cover);
  document.querySelector(".app")?.toggleAttribute("inert", cover);
  sheet.className = "sheet " + cls;
  sheet.innerHTML = html;
  $(btnId).addEventListener("click", ev => { ev.stopPropagation(); onClick(); });
  clearTimeout(state.modalTimer);
  state.modalTimer = setTimeout(() => {
    state.modalKind = kind;
    $("modal").classList.add("show");
    $(btnId).focus({ preventScroll: true });
  }, reduceMotion() ? 0 : delay);
}

function localeHref(code) {
  const root = document.documentElement.dataset.root || "./";
  const cur = document.documentElement.lang;
  if (code === cur) return "./";
  if (code === "zh-Hant") return root;
  return root + code + "/";
}
function langNav() {
  const cur = document.documentElement.lang;
  return `<nav class="lang-switch" aria-label="Language">${[
    ["zh-Hant", "繁中"],
    ["en", "English"],
    ["ja", "日本語"]
  ].map(([code, label]) => {
    const current = code === cur ? ' aria-current="page"' : "";
    return `<a href="${localeHref(code)}" hreflang="${code}" lang="${code}"${current}>${label}</a>`;
  }).join("")}</nav>`;
}

function showStart() {
  showModal("start", "neutral", `
    <div class="ver">v${VERSION}</div>
    <div class="cover-main">
      ${langNav()}
      <div class="mark">R</div>
      <div class="sheet-title" id="verdict">${T.coverTitle}</div>
      <ul class="rules">
        <li>${T.rule1()}</li>
        <li>${T.rule2(TIME_LIMIT, PENALTY)}</li>
        <li>${T.rule3()}</li>
      </ul>
      <div class="record">${T.bestRecord(state.best)}</div>
      <button class="next" id="startBtn" style="margin-top:12px">${T.start}</button>
    </div>
    <footer class="cover-foot">
      <nav class="cover-links">
        <button type="button" data-panel="privacy">${T.privacy}</button><span>·</span>
        <button type="button" data-panel="source">${T.source}</button><span>·</span>
        <button type="button" data-panel="copyright">${T.copyright}</button>
      </nav>
      <p class="cover-copy">© 2026 <span id="copyHost"></span></p>
    </footer>
    <section class="legal-panel" id="panel-privacy" hidden>
      <div class="legal-bar"><button type="button" class="legal-back" data-close>${T.back}</button></div>
      <div class="legal-inner">${T.legalPrivacy}</div>
    </section>
    <section class="legal-panel" id="panel-source" hidden>
      <div class="legal-bar"><button type="button" class="legal-back" data-close>${T.back}</button></div>
      <div class="legal-inner">${T.legalSource}</div>
    </section>
    <section class="legal-panel" id="panel-copyright" hidden>
      <div class="legal-bar"><button type="button" class="legal-back" data-close>${T.back}</button></div>
      <div class="legal-inner">${T.legalCopyright}</div>
    </section>`, "startBtn", startGame);
  wireCoverLegal();
  const host = location.hostname.replace(/^www\./, "");
  if ($("copyHost")) $("copyHost").textContent = host || location.host;
}

function coverPanelOpen() { return document.querySelector(".legal-panel.open"); }
function closeCoverPanels() {
  document.querySelectorAll(".legal-panel").forEach(p => { p.classList.remove("open"); p.hidden = true; });
  $("startBtn")?.focus({ preventScroll: true });
}
function wireCoverLegal() {
  document.querySelectorAll(".cover-links [data-panel]").forEach(b => b.addEventListener("click", ev => {
    ev.stopPropagation();
    document.querySelectorAll(".legal-panel").forEach(p => { p.classList.remove("open"); p.hidden = true; });
    const panel = $("panel-" + b.dataset.panel);
    if (!panel) return;
    panel.hidden = false;
    panel.classList.add("open");
    panel.querySelector("[data-close]")?.focus({ preventScroll: true });
  }));
  document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", ev => { ev.stopPropagation(); closeCoverPanels(); }));
}

function startGame() {
  Object.assign(state, { phase: "playing", score: 0, rounds: 0, streak: 0, maxStreak: 0, timeLeft: TIME_LIMIT, timerRunning: false });
  renderStats();
  newRound();
}

function choose(c) {
  if (state.phase !== "playing" || state.answered || state.animating) return;
  state.answered = true;
  state.timerRunning = false;
  const { mon, move } = state.round;
  const ok = c === move.cat;
  state.rounds++;
  if (ok) { state.score++; state.streak++; state.maxStreak = Math.max(state.maxStreak, state.streak); }
  else {
    state.streak = 0;
    state.timeLeft = Math.max(0, state.timeLeft - PENALTY);
    $("timeStat").insertAdjacentHTML("beforeend", `<span class="penalty">${T.penalty(PENALTY)}</span>`);
    setTimeout(() => $("timeStat").querySelector(".penalty")?.remove(), 1200);
  }
  renderStats();
  $("game").classList.add("revealed");
  document.querySelectorAll(".choice").forEach((b, j) => {
    b.disabled = true;
    if (j === move.cat) b.classList.add("correct");
    else if (j === c) b.classList.add("wrong");
  });
  const mv = `<span class="mv">${move.name}</span>`;
  const finalText = ok ? T.successLine(REFLECT[c], mon.name) : T.failLine(REFLECT[c]);
  const e = enc = { done: false, skipped: false, cancelled: false, wake: null };
  const sleep = sleeper(e);
  const orbs = [];
  state.animating = true;
  (async () => {
    if (!reduceMotion()) {
      if (!await sleep(300)) return;
      $("dialog").classList.remove("done");
      $("dialogText").innerHTML = T.opponentUsed(mon.name, mv);
      orbs.push(fly("t-" + move.type, $("foe"), $("me"), 200));
      if (!await sleep(230)) return;
      shake($("me"), ok ? "#fff" : "#ff5c6c");
      if (!await sleep(200)) return;
      $("dialogText").textContent = T.wobUsed(REFLECT[c]);
      if (!await sleep(150)) return;
      if (ok) {
        orbs.push(fly(c ? "mirror" : "counter", $("me"), $("foe"), 200));
        if (!await sleep(230)) return;
        shake($("foe"), c ? "#7fb8ff" : "#ff8a3d");
      }
      $("dialogText").textContent = finalText;
      await sleep(350);
    }
  })().then(() => {
    if (e.cancelled) return;
    orbs.forEach(o => o.anim.cancel());
    $("dialog").classList.remove("done");
    $("dialogText").textContent = finalText;
    e.done = true;
    state.animating = false;
    if (state.timeLeft === 0) return timeUp();
    showAnswer(ok, c, mon, move);
  });
}

function showAnswer(ok, c, mon, move) {
  const explain = ok
    ? T.explainOk(CATS[move.cat], REFLECT[move.cat])
    : T.explainBad(CATS[move.cat], REFLECT[move.cat], REFLECT[c], CATS[c]);
  showModal("answer", ok ? "good" : "bad", `
    <div class="mark">${ok ? "✓" : "✕"}</div>
    <div class="verdict" id="verdict">${ok ? T.hit : T.miss}</div>
    ${ok && state.streak >= 2 ? `<div class="streak-note">${T.streak(state.streak)}</div>` : ""}
    ${ok ? "" : `<div class="penalty-note">⏱ ${T.penalty(PENALTY)}</div>`}
    <div class="move-card">
      <span class="type t-${move.type}">${TYPES[move.type]}</span>
      <div class="mvname">${move.name}</div>
      <div class="meta">${T.moveMeta(mon.name, move.power)}</div>
      <span class="cat ${move.cat ? "spec" : "phys"}">${T.catMove(CATS[move.cat])}</span>
    </div>
    <div class="explain">${explain}</div>
    <button class="next" id="nextBtn">${T.next}</button>`, "nextBtn", nextQuestion, 150);
}

function nextQuestion() { if (state.phase === "playing" && state.answered && !state.animating) newRound(); }

function timeUp() {
  state.timerRunning = false;
  state.phase = "over";
  state.answered = true;
  $("game").classList.add("revealed");
  document.querySelectorAll(".choice").forEach((b, j) => {
    b.disabled = true;
    if (j === state.round.move.cat) b.classList.add("correct");
  });
  $("dialog").classList.remove("done");
  $("dialogText").textContent = T.timeUp;
  const newRecord = state.score > state.best;
  if (newRecord) { state.best = state.score; localStorage.setItem("wob-best", state.best); }
  renderStats();
  const acc = state.rounds ? Math.round(state.score / state.rounds * 100) : 0;
  showModal("result", "neutral", `
    <div class="mark">🏁</div>
    <div class="sheet-title" id="verdict">${T.timeUp}</div>
    <div class="big-score">${state.score}<small>${T.scoreUnit}</small></div>
    <div class="summary">
      <div><b>${state.rounds}</b><span>${T.statRounds}</span></div>
      <div><b>${acc}%</b><span>${T.statAcc}</span></div>
      <div><b>${state.maxStreak}</b><span>${T.statStreak}</span></div>
    </div>
    <div class="record ${newRecord ? "new" : ""}">${newRecord ? T.newRecord : T.bestRecord(state.best)}</div>
    <button class="next" id="startBtn" style="margin-top:12px">${T.replay}</button>`, "startBtn", startGame, 700);
}

document.querySelectorAll(".choice").forEach(b => b.addEventListener("click", ev => { ev.stopPropagation(); choose(+b.dataset.c); }));
document.addEventListener("keydown", e => {
  if (state.animating) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); skipEncounter(); }
    return;
  }
  if (e.key === "Escape" && coverPanelOpen()) { e.preventDefault(); closeCoverPanels(); return; }
  const confirm = e.key === "Enter" || e.key === " ";
  if (confirm && coverPanelOpen()) return;
  if (confirm && (state.modalKind === "start" || state.modalKind === "result")) { e.preventDefault(); startGame(); }
  else if (e.key === "1" || e.key === "2") choose(+e.key - 1);
  else if (confirm && state.answered) { e.preventDefault(); nextQuestion(); }
});
document.addEventListener("click", () => { if (state.animating) skipEncounter(); });

setSprite($("meImg"), spriteUrl(202, true));
fillUpcoming();
window.__wob = { MOVES, MONS, state, generateRound, newRound, choose, startGame, timeUp };
renderStats();
requestAnimationFrame(tick);
showStart();
