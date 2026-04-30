import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { setupPauseMenuEvents } from './pause-menu.js';
import { LEVELS } from './levels.js';
import { activeWeights, applyLayout, updateActiveWeights } from './layout.js';
import {
  translationsFile, loadTranslations,
  getCurrentLang, tr, trf,
  getInitialLanguage, updatePageLanguage,
} from './i18n.js';

if (Physics2DPlugin) gsap.registerPlugin(Physics2DPlugin);
document.addEventListener('dblclick', (e) => e.preventDefault());

// ─────────────────────────────────────────────────────────────────────────────
// DOM 元素
// ─────────────────────────────────────────────────────────────────────────────

const homeScreen      = document.getElementById('home-screen');
const gameScreen      = document.getElementById('game-screen');
const playfield       = document.querySelector('.playfield');
const eliminatedCountEl = document.getElementById('eliminated-count');
const targetClearEl   = document.getElementById('target-clear-display');
const currentLevelEl  = document.getElementById('current-level-display');
const pauseBtn        = document.getElementById('pause-btn');
const pauseMenu       = document.getElementById('pause-menu');
const resumeBtn       = document.getElementById('resume-btn');
const homeBtn         = document.getElementById('home-btn');
const restartGameBtn  = document.getElementById('restart-game-btn');
const numbersContainer = document.getElementById('numbers-container');

// ─────────────────────────────────────────────────────────────────────────────
// 遊戲狀態
// ─────────────────────────────────────────────────────────────────────────────

let maxLevelReached    = parseInt(localStorage.getItem('maxLevel') || '0', 10);
if (isNaN(maxLevelReached) || maxLevelReached < 0) maxLevelReached = 0;

let gameRunning        = false;
let gameEnding         = false;
let autoDropTimer      = null;
let eliminatedRowsCount = 0;
let rowsQueued         = 0;
let currentLevel       = 0;

// ─────────────────────────────────────────────────────────────────────────────
// 首頁：進度條
// ─────────────────────────────────────────────────────────────────────────────

function renderHomeProgress() {
  const lang  = getCurrentLang();
  const lvIdx = Math.min(maxLevelReached, LEVELS.length - 1);

  const curEl = document.getElementById('home-current-level');
  const totEl = document.getElementById('home-total-levels');
  const chapterEl = document.getElementById('home-chapter-name');
  const barEl = document.getElementById('home-progress-bar');
  const btn   = document.getElementById('start-btn');

  if (curEl) curEl.textContent = lvIdx + 1;
  if (totEl) totEl.textContent = LEVELS.length;
  if (chapterEl) chapterEl.textContent = tr(LEVELS[lvIdx].labelKey, LEVELS[lvIdx].labelKey);
  if (barEl) barEl.style.width = `${maxLevelReached === 0 ? 0 : (maxLevelReached / LEVELS.length) * 100}%`;
  if (btn) btn.textContent = maxLevelReached === 0 ? tr('startGame', '▶ Start') : tr('continueGame', '▶ Continue');
}

function startLevelFromMap(levelIdx) {
  applyLayout(LEVELS[levelIdx].maxNumber);
  homeScreen.classList.remove('active');
  gameScreen.classList.add('active');
  gsap.fromTo(gameScreen, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  startGame(levelIdx);
}

function returnToLevelMap() {
  gameRunning = false;
  gameEnding  = false;
  if (autoDropTimer) { clearInterval(autoDropTimer); autoDropTimer = null; }
  document.getElementById('game-over-screen')?.classList.remove('active');
  gameScreen.classList.remove('active');
  homeScreen.classList.add('active');
  renderHomeProgress();
  gsap.fromTo(homeScreen, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 遊戲核心邏輯
// ─────────────────────────────────────────────────────────────────────────────

function updateStatusDisplay() {
  const level = LEVELS[currentLevel];
  if (eliminatedCountEl) eliminatedCountEl.textContent = eliminatedRowsCount;
  if (targetClearEl)     targetClearEl.textContent     = level.targetClear;
  if (currentLevelEl)    currentLevelEl.textContent    = currentLevel + 1;
}

function renderNumbers() {
  numbersContainer.innerHTML = '';
  const qEl = document.createElement('div');
  qEl.className = 'number-label';
  qEl.textContent = 'Q';
  numbersContainer.appendChild(qEl);
  activeWeights.forEach(n => {
    const el = document.createElement('div');
    el.className = 'number-label';
    el.textContent = n;
    numbersContainer.appendChild(el);
  });
}

function startGame(levelIndex = 0) {
  currentLevel        = Math.min(levelIndex, LEVELS.length - 1);
  gameRunning         = true;
  gameEnding          = false;
  eliminatedRowsCount = 0;
  rowsQueued          = 0;

  updateActiveWeights(LEVELS[currentLevel].maxNumber);
  updateStatusDisplay();

  if (playfield) {
    playfield.innerHTML = '';
    playfield.classList.remove('game-ending');
  }
  if (autoDropTimer) { clearTimeout(autoDropTimer); autoDropTimer = null; }

  // 等 --bit-size 計算完成後再放入初始題目
  requestAnimationFrame(() => {
    renderNumbers();
    const { initialRows, targetClear } = LEVELS[currentLevel];
    const startCount = Math.min(initialRows, targetClear);
    for (let i = 0; i < startCount; i++) {
      setTimeout(() => { if (gameRunning) { dropNewRow(); rowsQueued++; } }, 200 * (i + 1));
    }
  });
}

function gameOver(isWin = false) {
  gameRunning = false;
  if (autoDropTimer) { clearInterval(autoDropTimer); autoDropTimer = null; }

  const gameOverScreen        = document.getElementById('game-over-screen');
  const gameOverTitle         = document.getElementById('game-over-title');
  const allLevelsClearedTitle = document.getElementById('all-levels-cleared-title');

  if (isWin) {
    gameOverTitle.classList.remove('active');
    allLevelsClearedTitle.classList.add('active');
    document.getElementById('final-stats')?.classList.remove('active');
    const allClearCount = document.getElementById('all-clear-count');
    if (allClearCount) allClearCount.textContent = trf('allLevelsComplete', { n: LEVELS.length }, `All ${LEVELS.length} levels complete!`);
  } else {
    gameOverTitle.classList.add('active');
    allLevelsClearedTitle.classList.remove('active');
    document.getElementById('final-stats')?.classList.add('active');
    const finalText = document.getElementById('final-level-reached-text');
    if (finalText) finalText.textContent = trf('finalLevelReached', { n: currentLevel + 1 }, `Reached Level ${currentLevel + 1}`);
  }

  gameScreen.classList.remove('active');
  if (gameOverScreen) {
    gameOverScreen.classList.add('active');
    gsap.fromTo(gameOverScreen, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
  }
}

function levelClear() {
  gameRunning = false;
  if (autoDropTimer) { clearInterval(autoDropTimer); autoDropTimer = null; }

  // 儲存進度
  if (currentLevel + 1 > maxLevelReached) {
    maxLevelReached = Math.min(currentLevel + 1, LEVELS.length - 1);
    localStorage.setItem('maxLevel', maxLevelReached);
  }

  const isLastLevel = currentLevel >= LEVELS.length - 1;
  const overlay     = document.getElementById('level-clear-overlay');
  const titleEl     = document.getElementById('level-clear-title');
  const nextEl      = document.getElementById('level-clear-next');
  const continueBtn = document.getElementById('level-clear-continue-btn');
  const homeBtnClear = document.getElementById('level-clear-home-btn');
  if (!overlay || !titleEl) return;

  titleEl.textContent = tr('levelClear', 'Level Clear!');
  if (nextEl) nextEl.textContent = isLastLevel
    ? tr('allDone', 'All Clear! 🎉')
    : `${tr('nextLevel', 'Next: ')}Level ${currentLevel + 2}`;

  const dismissOverlay = (action) => {
    if (continueBtn)  continueBtn.onclick  = null;
    if (homeBtnClear) homeBtnClear.onclick = null;
    gsap.to(overlay, { opacity: 0, duration: 0.25,
      onComplete: () => { overlay.classList.add('hidden'); action(); }
    });
  };

  if (continueBtn) continueBtn.onclick = () => dismissOverlay(() => {
    if (isLastLevel) { gameOver(true); }
    else { applyLayout(LEVELS[currentLevel + 1].maxNumber); startGame(currentLevel + 1); }
  });
  if (homeBtnClear) homeBtnClear.onclick = () => dismissOverlay(() => returnToLevelMap());

  overlay.classList.remove('hidden');
  gsap.fromTo(overlay, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
}

function checkGameOver() {
  if (!playfield || !gameRunning || gameEnding) return;
  if (playfield.querySelectorAll('.bits-row').length >= 6) {
    gameEnding = true;
    playfield.classList.add('game-ending');
    setTimeout(() => gameOver(false), 100);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 棋盤：題目卡片
// ─────────────────────────────────────────────────────────────────────────────

function dropNewRow() {
  if (!playfield || !gameRunning || gameEnding) return;

  const row = document.createElement('div');
  row.className = 'bits-row';

  // 左側：人類數字
  const qBox = document.createElement('div');
  qBox.className = 'bit target-box';
  qBox.textContent = randInt(1, LEVELS[currentLevel].maxNumber);
  row.appendChild(qBox);

  // 翻譯箭頭
  const arrow = document.createElement('span');
  arrow.className = 'card-translate-arrow';
  arrow.textContent = '→';
  row.appendChild(arrow);

  // 右側：位元格
  const bitsZone = document.createElement('div');
  bitsZone.className = 'card-bits-zone';
  activeWeights.forEach(weight => {
    const bit = document.createElement('div');
    bit.className = 'bit bit-zero';
    bit.dataset.weight = weight;
    addBitEventListeners(bit);
    bitsZone.appendChild(bit);
  });
  row.appendChild(bitsZone);

  // 有佔位符就填入，否則放到底部
  const placeholder = playfield.querySelector('.card-placeholder');
  if (placeholder) placeholder.replaceWith(row);
  else playfield.appendChild(row);

  gsap.from(row, { x: -50, opacity: 0, duration: 0.35, ease: 'power2.out',
    onComplete: () => setTimeout(() => checkGameOver(), 100),
  });
}

function checkAndEliminateMatches() {
  if (!playfield || !gameRunning || gameEnding) return;
  if (playfield.dataset.isEliminating === 'true') return;

  const allRows = Array.from(playfield.querySelectorAll('.bits-row'));
  const rowsToEliminate = allRows.filter(row => {
    const targetBox  = row.querySelector('.target-box');
    const answerBits = row.querySelectorAll('.bit:not(.target-box)');
    if (!targetBox || answerBits.length !== activeWeights.length) return false;
    const sum = [...answerBits].reduce((acc, bit, i) =>
      acc + (bit.classList.contains('bit-one') ? activeWeights[i] : 0), 0);
    return sum === parseInt(targetBox.textContent, 10);
  });

  if (rowsToEliminate.length === 0) return;

  // 答對的列立刻鎖定，防止玩家在飛出動畫期間繼續點擊
  rowsToEliminate.forEach(row => { row.style.pointerEvents = 'none'; });

  playfield.dataset.isEliminating = 'true';

  const tl = gsap.timeline({
    onComplete: () => {
      eliminatedRowsCount += rowsToEliminate.length;

      // 消除位置換成佔位符，讓其他牌留在原地
      rowsToEliminate.forEach(row => {
        const ph = document.createElement('div');
        ph.className = 'card-placeholder';
        ph.style.height = row.offsetHeight + 'px';
        row.replaceWith(ph);
      });

      playfield.dataset.isEliminating = 'false';
      updateStatusDisplay();

      if (eliminatedRowsCount >= LEVELS[currentLevel].targetClear) {
        levelClear();
      } else {
        const { targetClear, initialRows } = LEVELS[currentLevel];
        const actualCards = playfield.querySelectorAll('.bits-row').length;
        const needMore = Math.min(targetClear - rowsQueued, initialRows - actualCards);
        for (let i = 0; i < needMore; i++) {
          rowsQueued++;
          setTimeout(() => { if (gameRunning) dropNewRow(); }, 300 + i * 180);
        }
        setTimeout(checkAndEliminateMatches, 50);
      }
    }
  });

  rowsToEliminate.forEach(row => animateSend(row, tl));
}

// ─────────────────────────────────────────────────────────────────────────────
// 動畫
// ─────────────────────────────────────────────────────────────────────────────

function animateSend(row, tl) {
  const rect  = row.getBoundingClientRect();
  const label = document.createElement('div');
  label.className = 'send-check-label';
  label.textContent = tr('sentLabel', '✓ Sent!');
  label.style.cssText = `position:fixed;left:${rect.left + rect.width * 0.55}px;top:${rect.top + rect.height / 2}px;transform:translateY(-50%);pointer-events:none;z-index:9999;`;
  document.body.appendChild(label);
  gsap.fromTo(label, { opacity: 1, x: 0 },
    { opacity: 0, x: 55, duration: 1.5, ease: 'power2.out', onComplete: () => label.remove() });

  tl.to(row, { backgroundColor: 'rgba(76,222,138,0.28)', borderColor: 'rgba(76,222,138,0.7)', duration: 0.13, ease: 'power1.in' }, '<')
    .to(row, { x: 140, opacity: 0, duration: 0.32, ease: 'power3.in' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 輸入：位元格點擊 / 觸控滑動
// ─────────────────────────────────────────────────────────────────────────────

function simpleToggle(e) {
  if (!gameRunning || gameEnding) return;
  const el = e.currentTarget;
  if (el.classList.contains('bit-zero')) el.classList.replace('bit-zero', 'bit-one');
  else                                   el.classList.replace('bit-one', 'bit-zero');
  gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: 'power1.out' });
  setTimeout(checkAndEliminateMatches, 100);
}

function addBitEventListeners(bit) {
  bit.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    simpleToggle(e);
    lastToggledBit = e.currentTarget;
  });
}

let isPointerDown  = false;
let lastToggledBit = null;

function handleMove(x, y) {
  const el = document.elementFromPoint(x, y);
  if (el?.classList?.contains('bit') && !el.classList.contains('target-box') && el !== lastToggledBit) {
    simpleToggle({ currentTarget: el });
    lastToggledBit = el;
  }
}

const isAndroid = /android/i.test(navigator.userAgent);
const gameBoard = document.querySelector('.playfield');

document.addEventListener('pointerdown',   (e) => { if (gameBoard.contains(e.target)) isPointerDown = true; });
document.addEventListener('pointermove',   (e) => { if (!isPointerDown || isAndroid) return; handleMove(e.clientX, e.clientY); });
document.addEventListener('pointerup',     () => { isPointerDown = false; lastToggledBit = null; });
document.addEventListener('pointercancel', () => { isPointerDown = false; lastToggledBit = null; });

if (isAndroid && gameBoard) {
  gameBoard.addEventListener('touchstart',  (e) => { isPointerDown = true; e.preventDefault(); }, { passive: false });
  gameBoard.addEventListener('touchmove',   (e) => { if (!isPointerDown) return; e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  gameBoard.addEventListener('touchend',    () => { isPointerDown = false; lastToggledBit = null; });
  gameBoard.addEventListener('touchcancel', () => { isPointerDown = false; lastToggledBit = null; });
}

// ─────────────────────────────────────────────────────────────────────────────
// 暫停選單
// ─────────────────────────────────────────────────────────────────────────────

const gameState = {
  get gameRunning()    { return gameRunning; },
  set gameRunning(v)   { gameRunning = v; },
  get gameEnding()     { return gameEnding; },
  set gameEnding(v)    { gameEnding = v; },
  get autoDropTimer()  { return autoDropTimer; },
  set autoDropTimer(v) { autoDropTimer = v; },
  pauseMenu, dropNewRow,
  startGame: () => startGame(currentLevel),
  pauseBtn, resumeBtn, homeBtn, restartGameBtn,
  homeScreen, gameScreen, gsap,
};
setupPauseMenuEvents(gameState);
homeBtn.addEventListener('click', () => renderHomeProgress());

// ─────────────────────────────────────────────────────────────────────────────
// 按鈕事件
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('restart-button')?.addEventListener('click', () => returnToLevelMap());
document.getElementById('retry-button')?.addEventListener('click', () => {
  document.getElementById('game-over-screen')?.classList.remove('active');
  startLevelFromMap(currentLevel);
});
document.getElementById('start-btn')?.addEventListener('click', () => startLevelFromMap(maxLevelReached));

// ─────────────────────────────────────────────────────────────────────────────
// 遊戲說明
// ─────────────────────────────────────────────────────────────────────────────

const infoScreen   = document.getElementById('info-screen');
const infoCloseBtn = document.getElementById('info-close-btn');

document.querySelectorAll('.info-open-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.info-lang').forEach(sec =>
      sec.classList.toggle('active', sec.classList.contains(`lang-${btn.dataset.l}`)));
    infoScreen?.classList.remove('hidden');
  });
});
infoCloseBtn?.addEventListener('click', () => infoScreen?.classList.add('hidden'));

// ─────────────────────────────────────────────────────────────────────────────
// 語言切換
// ─────────────────────────────────────────────────────────────────────────────

if (document.querySelector('.header-nav-lang')) {
  document.querySelector('.header-nav-lang-jp')?.addEventListener('click', () =>
    updatePageLanguage('ja', translationsFile, () => { if (homeScreen.classList.contains('active')) renderHomeProgress(); }));
  document.querySelector('.header-nav-lang-en')?.addEventListener('click', () =>
    updatePageLanguage('en', translationsFile, () => { if (homeScreen.classList.contains('active')) renderHomeProgress(); }));
  document.querySelector('.header-nav-lang-zh')?.addEventListener('click', () =>
    updatePageLanguage('zh', translationsFile, () => { if (homeScreen.classList.contains('active')) renderHomeProgress(); }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 初始化
// ─────────────────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const initialLang = getInitialLanguage();
updatePageLanguage(initialLang, translationsFile, () => renderHomeProgress());
renderHomeProgress();

document.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations();
  updatePageLanguage(getInitialLanguage(), translationsFile, () => renderHomeProgress());
  renderHomeProgress();
});
