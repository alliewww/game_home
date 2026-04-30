import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { setupPauseMenuEvents } from './pause-menu.js';

let translationsFile = null;

async function loadTranslations() {
  try {
    const response = await fetch(
      ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? './public/config/translations.json'
        : './config/translations.json'
    );
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) throw new Error('回應不是有效的 JSON');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    translationsFile = await response.json();
  } catch (error) {
    console.error('載入翻譯失敗:', error);
  }
}

// bit_burst — 關卡地圖版本
(() => {
  const ALL_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
  let activeWeights = [...ALL_WEIGHTS]; // 每關開始時更新

  // 根據最大數字算出需要幾個位元
  function getBitCount(maxNumber) {
    return Math.floor(Math.log2(maxNumber)) + 1;
  }

  // 從視窗尺寸同步計算並套用 --bit-size 和 --playfield-height
  // pfWidthOverride：可傳入 DOM 量出的精確值；省略時從 window 估算（不需 DOM）
  function applyLayout(maxNumber, pfWidthOverride) {
    const bitCount   = getBitCount(maxNumber);
    activeWeights    = ALL_WEIGHTS.slice(ALL_WEIGHTS.length - bitCount);

    const rem        = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    // 棋盤寬度：桌機 610px，手機 100dvw - 2rem
    const pfWidth    = pfWidthOverride ?? (window.innerWidth < 768 ? window.innerWidth - 2 * rem : 610);
    const pfPadding  = rem;            // padding-left + padding-right = 0.5rem * 2 = 1rem
    const bitGap     = 0.1  * rem;    // gap: 0.1rem
    const arrowWidth = 28;             // .card-translate-arrow width + bits-zone padding
    const totalCells = bitCount + 1;

    const byWidth  = (pfWidth - pfPadding - totalCells * bitGap - arrowWidth) / totalCells;
    // 高度：棋盤 3 張卡 + 其他 UI 都要塞進螢幕
    // (bs*3 + 97) + (bs*0.4 + 12) + 任務列40 + 狀態列48 + 邊距38 ≈ bs*3.4 + 235
    const byHeight = (window.innerHeight - 235) / 3.4;

    const bs = Math.floor(Math.max(20, Math.min(byWidth, byHeight)));
    document.documentElement.style.setProperty('--bit-size', `${bs}px`);

    // 棋盤高度：每張卡 (bs+13) × 3 + 3個gap(6.4×3，含header後的gap) + header(23) + padding(16)
    // header = 18(height) + 4(pb) + 1(border) + 0(mb) = 23；padding = 0.6rem + 0.4rem = 16px
    const pfHeight = 3 * (bs + 13) + 3 * 6.4 + 23 + 16;
    document.documentElement.style.setProperty('--playfield-height', `${Math.ceil(pfHeight)}px`);
  }

  // 更新 activeWeights 並重算版面（在遊戲開始後由 DOM 精確量測再校正一次）
  function updateActiveWeights(maxNumber) {
    // 先同步用估算值設定（防止首次渲染時高度跳動）
    applyLayout(maxNumber);
    // 再用 DOM 量測的精確棋盤寬度校正
    requestAnimationFrame(() => {
      const pf = document.querySelector('.playfield');
      if (!pf) return;
      const domWidth = pf.getBoundingClientRect().width;
      if (domWidth > 0) applyLayout(maxNumber, domWidth);
    });
  }

  // ─── 程式生成 30 關 ───
  // 難度分 7 個等級（2-bit → 8-bit），每等級 3–6 關，共 30 關
  const LEVEL_TIERS = [
    { maxNumber: 3,   levelCount: 3, baseTarget: 2, label: { zh: '2 位元入門', ja: '2ビット入門',   en: '2-bit Starter'   } },
    { maxNumber: 7,   levelCount: 4, baseTarget: 3, label: { zh: '3 位元初級', ja: '3ビット初級',   en: '3-bit Basic'     } },
    { maxNumber: 15,  levelCount: 4, baseTarget: 4, label: { zh: '4 位元中級', ja: '4ビット中級',   en: '4-bit Intermediate' } },
    { maxNumber: 31,  levelCount: 4, baseTarget: 5, label: { zh: '5 位元挑戰', ja: '5ビット挑戦',   en: '5-bit Challenge'  } },
    { maxNumber: 63,  levelCount: 4, baseTarget: 6, label: { zh: '6 位元進階', ja: '6ビット上級',   en: '6-bit Advanced'  } },
    { maxNumber: 127, levelCount: 5, baseTarget: 7, label: { zh: '7 位元高手', ja: '7ビット達人',   en: '7-bit Expert'    } },
    { maxNumber: 255, levelCount: 6, baseTarget: 8, label: { zh: '8 位元大師', ja: '8ビットマスター', en: '8-bit Master'   } },
  ]; // 3+4+4+4+4+5+6 = 30 關

  function generateLevels() {
    const levels = [];
    LEVEL_TIERS.forEach(tier => {
      for (let i = 0; i < tier.levelCount; i++) {
        levels.push({
          maxNumber:   tier.maxNumber,
          targetClear: tier.baseTarget + i,
          initialRows: Math.min(3, tier.baseTarget + i),
          tierLabel:   tier.label,
        });
      }
    });
    return levels;
  }
  const LEVELS = generateLevels();

  // 阻止行動裝置雙擊放大
  document.addEventListener('dblclick', (e) => e.preventDefault());

  // Elements
  const homeScreen   = document.getElementById('home-screen');
  const gameScreen   = document.getElementById('game-screen');
  const playfield    = document.querySelector('.playfield');
  const eliminatedCountEl    = document.getElementById('eliminated-count');
  const pauseBtn             = document.getElementById('pause-btn');
  const pauseMenu            = document.getElementById('pause-menu');
  const resumeBtn            = document.getElementById('resume-btn');
  const homeBtn              = document.getElementById('home-btn');
  const restartGameBtn       = document.getElementById('restart-game-btn');
  const currentLevelEl       = document.getElementById('current-level-display');
  const targetClearEl        = document.getElementById('target-clear-display');

  // 進度儲存：記錄玩家已解鎖的最高關卡索引（0-indexed）
  let maxLevelReached = parseInt(localStorage.getItem('maxLevel') || '0', 10);
  if (isNaN(maxLevelReached) || maxLevelReached < 0) maxLevelReached = 0;

  // 遊戲狀態
  let gameRunning        = false;
  let gameEnding         = false;
  let autoDropTimer      = null;
  let eliminatedRowsCount = 0;
  let rowsQueued         = 0;  // 這關已放入棋盤的題目總數（含已消除的）
  let currentLevel       = 0; // 0-indexed

  if (Physics2DPlugin) gsap.registerPlugin(Physics2DPlugin);

  // ─────────────────────────────────────────────
  // 關卡地圖
  // ─────────────────────────────────────────────

  function getCurrentLang() {
    if (document.querySelector('.header-nav-lang-zh.active')) return 'zh';
    if (document.querySelector('.header-nav-lang-jp.active')) return 'ja';
    return 'en';
  }

  // ─── 首頁進度條渲染 ───
  function renderHomeProgress() {
    const lang = getCurrentLang();
    const lvIdx = Math.min(maxLevelReached, LEVELS.length - 1);
    const lv    = LEVELS[lvIdx];

    // 關卡數字
    const curEl = document.getElementById('home-current-level');
    const totEl = document.getElementById('home-total-levels');
    if (curEl) curEl.textContent = lvIdx + 1;
    if (totEl) totEl.textContent = LEVELS.length;

    // 章節名稱
    const chapterEl = document.getElementById('home-chapter-name');
    if (chapterEl) chapterEl.textContent = lv.tierLabel[lang] || lv.tierLabel.en;

    // 進度條
    const barEl = document.getElementById('home-progress-bar');
    if (barEl) {
      const pct = maxLevelReached === 0 ? 0 : (maxLevelReached / LEVELS.length) * 100;
      barEl.style.width = `${pct}%`;
    }

    // 按鈕文字
    const btn = document.getElementById('start-btn');
    if (btn) {
      const trBtn = (key, fallback) => translationsFile?.translations?.[key]?.[lang] ?? translationsFile?.translations?.[key]?.en ?? fallback;
      btn.textContent = maxLevelReached === 0 ? trBtn('startGame', '▶ Start') : trBtn('continueGame', '▶ Continue');
    }
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
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) gameOverScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    homeScreen.classList.add('active');
    renderHomeProgress();
    gsap.fromTo(homeScreen, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }

  // ─────────────────────────────────────────────
  // 遊戲邏輯
  // ─────────────────────────────────────────────

  // 返回地圖按鈕（Game Over 畫面）
  const restartBtn = document.getElementById('restart-button');
  restartBtn.addEventListener('click', () => returnToLevelMap());

  const retryBtn = document.getElementById('retry-button');
  retryBtn?.addEventListener('click', () => {
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) gameOverScreen.classList.remove('active');
    startLevelFromMap(currentLevel);
  });

  // 首頁「開始翻譯 / 繼續翻譯」按鈕
  const homeStartBtn = document.getElementById('start-btn');
  if (homeStartBtn) {
    homeStartBtn.addEventListener('click', () => startLevelFromMap(maxLevelReached));
  }

  function updateStatusDisplay() {
    const level = LEVELS[currentLevel];
    if (eliminatedCountEl) eliminatedCountEl.textContent = eliminatedRowsCount;
    if (targetClearEl)     targetClearEl.textContent     = level.targetClear;
    if (currentLevelEl)    currentLevelEl.textContent    = currentLevel + 1;
  }

  function startGame(levelIndex = 0) {
    currentLevel        = Math.min(levelIndex, LEVELS.length - 1);
    gameRunning         = true;
    gameEnding          = false;
    eliminatedRowsCount = 0;
    rowsQueued          = 0;

    const level = LEVELS[currentLevel];

    // 更新位元數與格子尺寸
    updateActiveWeights(level.maxNumber);

    updateStatusDisplay();

    if (playfield) {
      playfield.innerHTML = '';
      playfield.classList.remove('game-ending');
    }

    if (autoDropTimer) {
      clearTimeout(autoDropTimer);
      autoDropTimer = null;
    }

    // 等 --bit-size 算好後再放入初始題目
    requestAnimationFrame(() => {
      renderNumbers();
      const startCount = Math.min(level.initialRows, level.targetClear);
      for (let i = 0; i < startCount; i++) {
        setTimeout(() => { if (gameRunning) { dropNewRow(); rowsQueued++; } }, 200 * (i + 1));
      }
    });
  }

  function gameOver(isWin = false) {
    gameRunning = false;
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }

    const gameOverScreen          = document.getElementById('game-over-screen');
    const gameOverTitle           = document.getElementById('game-over-title');
    const allLevelsClearedTitle   = document.getElementById('all-levels-cleared-title');
    const finalStats              = document.getElementById('final-stats');
    const finalLevelReached       = document.getElementById('final-level-reached');

    const lang = getCurrentLang();
    const finalTextLabels    = { zh: `抵達第 ${currentLevel + 1} 關`, ja: `第${currentLevel + 1}ステージ到達`, en: `Reached Level ${currentLevel + 1}` };
    const allClearTextLabels = { zh: `全部 ${LEVELS.length} 關完成！`, ja: `全${LEVELS.length}ステージクリア！`, en: `All ${LEVELS.length} levels complete!` };

    if (isWin) {
      gameOverTitle.classList.remove('active');
      allLevelsClearedTitle.classList.add('active');
      finalStats?.classList.remove('active');
      const allClearCount = document.getElementById('all-clear-count');
      if (allClearCount) allClearCount.textContent = allClearTextLabels[lang] || allClearTextLabels.en;
    } else {
      gameOverTitle.classList.add('active');
      allLevelsClearedTitle.classList.remove('active');
      finalStats?.classList.add('active');
      const finalLevelReachedText = document.getElementById('final-level-reached-text');
      if (finalLevelReachedText) finalLevelReachedText.textContent = finalTextLabels[lang] || finalTextLabels.en;
    }

    gameScreen.classList.remove('active');
    if (gameOverScreen) {
      gameOverScreen.classList.add('active');
      gsap.fromTo(gameOverScreen, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    }
  }

  function levelClear() {
    gameRunning = false;
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }

    // 儲存進度：解鎖下一關
    if (currentLevel + 1 > maxLevelReached) {
      maxLevelReached = Math.min(currentLevel + 1, LEVELS.length - 1);
      localStorage.setItem('maxLevel', maxLevelReached);
    }

    const isLastLevel = currentLevel >= LEVELS.length - 1;
    const overlay   = document.getElementById('level-clear-overlay');
    const titleEl   = document.getElementById('level-clear-title');
    const nextEl    = document.getElementById('level-clear-next');

    const lang = getCurrentLang();
    const tr   = (key, fallback) => translationsFile?.translations?.[key]?.[lang] ?? translationsFile?.translations?.[key]?.en ?? fallback;

    if (overlay && titleEl) {
      titleEl.textContent = tr('levelClear', 'Level Clear!');

      const continueBtn = document.getElementById('level-clear-continue-btn');
      const homeBtn2    = document.getElementById('level-clear-home-btn');

      if (nextEl) {
        nextEl.textContent = isLastLevel
          ? tr('allDone', 'All Clear! 🎉')
          : `${tr('nextLevel', 'Next: ')}Level ${currentLevel + 2}`;
      }

      const dismissOverlay = (action) => {
        continueBtn.onclick = null;
        homeBtn2.onclick    = null;
        gsap.to(overlay, {
          opacity: 0, duration: 0.25,
          onComplete: () => { overlay.classList.add('hidden'); action(); }
        });
      };

      if (continueBtn) continueBtn.onclick = () =>
        dismissOverlay(() => {
          if (isLastLevel) {
            gameOver(true);
          } else {
            applyLayout(LEVELS[currentLevel + 1].maxNumber);
            startGame(currentLevel + 1);
          }
        });

      if (homeBtn2) homeBtn2.onclick = () =>
        dismissOverlay(() => returnToLevelMap());

      overlay.classList.remove('hidden');
      gsap.fromTo(overlay, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    }
  }

  function checkGameOver() {
    if (!playfield || !gameRunning || gameEnding) return;
    if (playfield.querySelectorAll('.bits-row').length >= 6) {
      gameEnding = true;
      playfield.classList.add('game-ending');
      setTimeout(() => gameOver(false), 100);
    }
  }

  function dropNewRow() {
    if (!playfield || !gameRunning || gameEnding) return;

    const row = document.createElement('div');
    row.className = 'bits-row';

    // 左側：人類的數字（暖色輸入框）
    const qBox = document.createElement('div');
    qBox.className = 'bit target-box';
    qBox.textContent = randInt(1, LEVELS[currentLevel].maxNumber);
    row.appendChild(qBox);

    // 翻譯箭頭
    const arrowEl = document.createElement('span');
    arrowEl.className = 'card-translate-arrow';
    arrowEl.textContent = '→';
    row.appendChild(arrowEl);

    // 右側：電腦的語言（冷色位元格區）
    const bitsZone = document.createElement('div');
    bitsZone.className = 'card-bits-zone';
    activeWeights.forEach((weight) => {
      const bit = document.createElement('div');
      bit.className = 'bit bit-zero';
      bit.dataset.weight = weight; // 顯示在格子上的位元值標籤
      addBitEventListeners(bit);
      bitsZone.appendChild(bit);
    });
    row.appendChild(bitsZone);

    // 有佔位符就填入該位置，否則 append 到底部
    const placeholder = playfield.querySelector('.card-placeholder');
    if (placeholder) {
      placeholder.replaceWith(row);
    } else {
      playfield.appendChild(row);
    }

    // 從左側滑入
    gsap.from(row, {
      x: -50,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => setTimeout(() => checkGameOver(), 100),
    });
  }

  function checkAndEliminateMatches() {
    if (!playfield || !gameRunning || gameEnding) return;
    if (playfield.dataset.isEliminating === 'true') return;

    const allRows = Array.from(playfield.querySelectorAll('.bits-row'));
    const rowsToEliminate = [];

    allRows.forEach(row => {
      const answerBits = row.querySelectorAll('.bit:not(.target-box)');
      const targetBox  = row.querySelector('.target-box');
      if (!targetBox || answerBits.length !== activeWeights.length) return;

      const targetNumber = parseInt(targetBox.textContent, 10);
      let currentSum = 0;
      answerBits.forEach((bit, i) => { if (bit.classList.contains('bit-one')) currentSum += activeWeights[i]; });
      if (currentSum === targetNumber) rowsToEliminate.push(row);
    });

    if (rowsToEliminate.length === 0) return;

    playfield.dataset.isEliminating = 'true';

    // 卡片布局：消除行只要向右飛出即可，其他行不需要位移（CSS flex 自動回彈）
    const tl = gsap.timeline({
      onComplete: () => {
        eliminatedRowsCount += rowsToEliminate.length;

        // 消除的位置換成佔位符，讓其他牌留在原地
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
          const level       = LEVELS[currentLevel];
          const canQueue    = level.targetClear - rowsQueued;
          const actualCards = playfield.querySelectorAll('.bits-row').length;
          const needMore    = Math.min(canQueue, level.initialRows - actualCards);
          for (let i = 0; i < needMore; i++) {
            rowsQueued++;
            setTimeout(() => { if (gameRunning) dropNewRow(); }, 300 + i * 180);
          }
          setTimeout(checkAndEliminateMatches, 50);
        }
      }
    });

    rowsToEliminate.forEach(row => {
      animateSend(row, tl);
    });
  }

  // 「發送成功」動畫：閃綠 → 往右飛出，並顯示浮動確認標
  function animateSend(row, tl) {
    // 顯示「✓ 已送出」浮標，從卡片右側往右飛走
    const rect = row.getBoundingClientRect();
    const check = document.createElement('div');
    check.className = 'send-check-label';
    check.textContent = '✓ 已送出';
    check.style.cssText = `
      position:fixed;
      left:${rect.left + rect.width * 0.55}px;
      top:${rect.top + rect.height / 2}px;
      transform:translateY(-50%);
      pointer-events:none;
      z-index:9999;
    `;
    document.body.appendChild(check);
    gsap.fromTo(check,
      { opacity: 1, x: 0 },
      { opacity: 0, x: 55, duration: 0.65, ease: 'power2.out', onComplete: () => check.remove() }
    );

    // 卡片本身：先閃綠 → 再往右加速飛出
    tl.to(row, {
      backgroundColor: 'rgba(76, 222, 138, 0.28)',
      borderColor:     'rgba(76, 222, 138, 0.7)',
      duration: 0.13,
      ease: 'power1.in',
    }, '<')
    .to(row, {
      x: 140,
      opacity: 0,
      duration: 0.32,
      ease: 'power3.in',
    });
  }

  function scatterBits(row) {
    row.querySelectorAll('.bit').forEach((bitEl) => {
      const rect = bitEl.getBoundingClientRect();
      const char = document.createElement('div');
      char.className = 'flying-char';
      char.textContent = bitEl.textContent;
      char.style.cssText = `position:absolute;left:${rect.left + rect.width/2}px;top:${rect.top + rect.height/2}px;transform:translate(-50%,-50%);font-size:${rect.height*0.5}px;color:${getComputedStyle(bitEl).color};pointer-events:none;`;
      document.body.appendChild(char);

      gsap.to(char, {
        duration: 3,
        rotation: gsap.utils.random(-720, 720),
        physics2D: { velocity: gsap.utils.random(200, 400), angle: gsap.utils.random(-110, -70), gravity: 500 },
        opacity: 0,
        onComplete: () => char.remove(),
      });
      gsap.to(bitEl, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(2)' });
    });
  }

  const numbersContainer = document.getElementById('numbers-container');
  function renderNumbers() {
    numbersContainer.innerHTML = '';
    // Q 標籤放在最前面（對應左側目標框）
    const qEl = document.createElement('div');
    qEl.className = 'number-label';
    qEl.textContent = 'Q';
    numbersContainer.appendChild(qEl);
    activeWeights.forEach((n) => {
      const el = document.createElement('div');
      el.className = 'number-label';
      el.textContent = n;
      numbersContainer.appendChild(el);
    });
  }

  function simpleToggle(e) {
    if (!gameRunning || gameEnding) return;
    const el = e.currentTarget;
    if (el.classList.contains('bit-zero')) {
      el.classList.replace('bit-zero', 'bit-one');
    } else {
      el.classList.replace('bit-one', 'bit-zero');
    }
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: 'power1.out' });
    setTimeout(checkAndEliminateMatches, 100);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // gameState 供暫停選單使用
  const gameState = {
    get gameRunning()  { return gameRunning; },
    set gameRunning(v) { gameRunning = v; },
    get gameEnding()   { return gameEnding; },
    set gameEnding(v)  { gameEnding = v; },
    get autoDropTimer()  { return autoDropTimer; },
    set autoDropTimer(v) { autoDropTimer = v; },
    pauseMenu,
    dropNewRow,
    startGame: () => startGame(currentLevel),
    pauseBtn,
    resumeBtn,
    homeBtn,
    restartGameBtn,
    homeScreen,
    gameScreen,
    gsap
  };

  setupPauseMenuEvents(gameState);

  // pause menu 裡的「回首頁」需要更新進度條
  homeBtn.addEventListener('click', () => renderHomeProgress(), { once: false });

  // ─────────────────────────────────────────────
  // 觸控事件
  // ─────────────────────────────────────────────
  let isPointerDown   = false;
  let lastToggledBit  = null;

  function addBitEventListeners(bit) {
    bit.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      simpleToggle(e);
      lastToggledBit = e.currentTarget;
    });
  }

  const isAndroid = /android/i.test(navigator.userAgent);
  const gameBoard = document.querySelector('.playfield');

  function handleMove(x, y) {
    const el = document.elementFromPoint(x, y);
    if (el?.classList?.contains('bit') && !el.classList.contains('target-box') && el !== lastToggledBit) {
      simpleToggle({ currentTarget: el });
      lastToggledBit = el;
    }
  }

  document.addEventListener('pointerdown',  (e) => { if (gameBoard.contains(e.target)) isPointerDown = true; });
  document.addEventListener('pointermove',  (e) => { if (!isPointerDown || isAndroid) return; handleMove(e.clientX, e.clientY); });
  document.addEventListener('pointerup',    () => { isPointerDown = false; lastToggledBit = null; });
  document.addEventListener('pointercancel',() => { isPointerDown = false; lastToggledBit = null; });

  if (isAndroid && gameBoard) {
    gameBoard.addEventListener('touchstart',  (e) => { isPointerDown = true; e.preventDefault(); }, { passive: false });
    gameBoard.addEventListener('touchmove',   (e) => { if (!isPointerDown) return; e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    gameBoard.addEventListener('touchend',    () => { isPointerDown = false; lastToggledBit = null; });
    gameBoard.addEventListener('touchcancel', () => { isPointerDown = false; lastToggledBit = null; });
  }

  // ─────────────────────────────────────────────
  // 遊戲說明 & 語言
  // ─────────────────────────────────────────────
  const infoScreen  = document.getElementById('info-screen');
  const infoCloseBtn = document.getElementById('info-close-btn');
  const infoOpenBtns = document.querySelectorAll('.info-open-btn');

  if (infoScreen && infoCloseBtn && infoOpenBtns.length) {
    infoOpenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.info-lang').forEach(sec => {
          sec.classList.toggle('active', sec.classList.contains(`lang-${btn.dataset.l}`));
        });
        infoScreen.classList.remove('hidden');
      });
    });
    infoCloseBtn.addEventListener('click', () => infoScreen.classList.add('hidden'));
  }

  const languageOrder = ['ja', 'zh', 'en'];
  let currentLanguageIndex = 0;

  function getInitialLanguage() {
    const lang = (navigator.language || navigator.userLanguage).toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  }

  function updatePageLanguage(lang, translations) {
    document.querySelectorAll('.info-open-btn').forEach(btn => {
      btn.style.display = btn.dataset.l === lang ? 'inline-block' : 'none';
    });
    // 首頁關卡前綴 label（第/レベル/Lv.）
    document.querySelectorAll('.home-level-label').forEach(el => {
      el.style.display = el.dataset.l === lang ? 'inline' : 'none';
    });
    document.querySelectorAll('.game-title span[lang]').forEach(span => {
      span.classList.toggle('active', span.lang === lang);
    });
    if (translations?.translations) {
      document.querySelectorAll('[data-translate]').forEach(el => {
        const key  = el.getAttribute('data-translate');
        const text = translations.translations[key]?.[lang] || translations.translations[key]?.['en'];
        if (text) el.textContent = text;
      });
    }
    document.querySelector('.header-nav-lang-jp')?.classList.toggle('active', lang === 'ja');
    document.querySelector('.header-nav-lang-en')?.classList.toggle('active', lang === 'en');
    document.querySelector('.header-nav-lang-zh')?.classList.toggle('active', lang === 'zh');
    currentLanguageIndex = languageOrder.indexOf(lang);
    const playfieldLabel = translations?.translations?.playfieldLabel?.[lang]
      ?? translations?.translations?.playfieldLabel?.en
      ?? '👤  Human Numbers  ─────►  🖥️  Computer Language';
    document.documentElement.style.setProperty('--playfield-label', `'${playfieldLabel}'`);
    // 語言切換後重新渲染進度條（文字要更新）
    if (homeScreen.classList.contains('active')) renderHomeProgress();
  }

  if (document.querySelector('.header-nav-lang')) {
    document.querySelector('.header-nav-lang-jp')?.addEventListener('click', () => updatePageLanguage('ja', translationsFile));
    document.querySelector('.header-nav-lang-en')?.addEventListener('click', () => updatePageLanguage('en', translationsFile));
    document.querySelector('.header-nav-lang-zh')?.addEventListener('click', () => updatePageLanguage('zh', translationsFile));
  }

  // 初始化
  const initialLang = getInitialLanguage();
  updatePageLanguage(initialLang, translationsFile);
  renderHomeProgress();

  document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    updatePageLanguage(getInitialLanguage(), translationsFile);
    renderHomeProgress();
  });
})();
