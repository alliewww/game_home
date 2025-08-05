import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { setupPauseMenuEvents } from './pause-menu.js';

let translationsFile = null;

// 異步載入翻譯
async function loadTranslations() {
  try {

    const response = await fetch(
      ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? './public/config/translations.json'
        : './config/translations.json'
    )
    
    // 檢查回應是否是 JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('回應不是有效的 JSON');
    }
    
    // 檢查回應狀態
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    translationsFile = await response.json();
  } catch (error) {
    console.error('載入翻譯失敗:', error);
  }
}

// bit_burst
(() => {
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  const GAME_TIME = 5000;

  // 阻止行動裝置雙擊放大
  document.addEventListener('dblclick', (e) => {
    e.preventDefault();
  });

  // Elements
  const homeScreen = document.getElementById("home-screen");
  const gameScreen = document.getElementById("game-screen");
  const playfield = document.querySelector('.playfield');
  const eliminatedCountEl = document.getElementById("eliminated-count");
  // 新增暫停選單相關元素
  const pauseBtn = document.getElementById("pause-btn");
  const pauseMenu = document.getElementById("pause-menu");
  const resumeBtn = document.getElementById("resume-btn");
  const homeBtn = document.getElementById("home-btn");
  const restartGameBtn = document.getElementById("restart-game-btn");

  // 最高分数记录
  const maxScoreEl = document.getElementById("max-score");
  let maxEliminatedRowsCount = localStorage.getItem('maxEliminatedRowsCount') || 0;
  maxScoreEl.textContent = maxEliminatedRowsCount;
  function updateMaxScore(currentScore) {
    if (currentScore > maxEliminatedRowsCount) {
      maxEliminatedRowsCount = currentScore;
      localStorage.setItem('maxEliminatedRowsCount', currentScore);
      maxScoreEl.textContent = currentScore;
    }
  }

  // 練習模式
  let isPracticeMode = false;
  let practiceLevel = 1;
  const PRACTICE_LEVELS = [
    { maxNumber: 15, initialRows: 3 },
    { maxNumber: 31, initialRows: 3 },
    { maxNumber: 63, initialRows: 4 },
    { maxNumber: 127, initialRows: 6 },
    { maxNumber: 255, initialRows: 5 }
  ];

  // 普通模式等級
  let levelInfo = 0;
  const LEVEL_INFO = [
    {eliminatedCount: 10, level: "4" , dropInterval: 2000},
    {eliminatedCount: 6, level: "3" , dropInterval: 3000},
    {eliminatedCount: 3, level: "2" , dropInterval: 4000},
    {eliminatedCount: 0, level: "1" , dropInterval: GAME_TIME}
  ]

  // 游戏状态管理
  let gameRunning = false;
  let gameEnding = false;
  let autoDropTimer = null;
  let eliminatedRowsCount = 0; // 成功消除的行数统计
  let currentDropInterval = GAME_TIME; // 当前掉落间隔（毫秒）
  let lastDropTime = 0; // 记录上次掉落的时间

  // Register plugin if not yet
  if (Physics2DPlugin) {
    gsap.registerPlugin(Physics2DPlugin);
  }

  // 開始遊戲按鈕
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");

    // 設置練習模式標誌
    isPracticeMode = false;
    practiceLevel = 1;

    // 开始游戏
    startGame();

    // GSAP 動畫示例：逐漸淡入主遊戲畫面
    gsap.fromTo(
      gameScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  });

  // 練習模式按鈕
  const practiceBtn = document.getElementById("practice-button");
  practiceBtn.addEventListener("click", () => {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");

    // 设置练习模式标志
    isPracticeMode = true;
    practiceLevel = 1;

    // 开始游戏
    startGame(true);

    // GSAP 動畫示例：逐漸淡入主遊戲畫面
    gsap.fromTo(
      gameScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  });

  // 返回首頁按鈕事件監聽器
  const restartBtn = document.getElementById("restart-button");
  restartBtn.addEventListener("click", () => {
    // 停止遊戲並重置狀態
    gameRunning = false;
    gameEnding = false;
    
    // 清除定时器
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }
    
    // 重新获取元素确保一致性
    const gameOverScreenElement = document.getElementById("game-over-screen");
    if (gameOverScreenElement) {
      gameOverScreenElement.classList.remove("active");
    }
    
    // 返回首页而不是直接开始游戏
    homeScreen.classList.add("active");

    // GSAP 動畫示例：逐漸淡入首页画面
    gsap.fromTo(
      homeScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  });

  // 更新状态显示
  const speedLevelEl = document.getElementById("speed-level");
  const nextLevelInfoEl = document.getElementById("next-level-info");
  const allLevelInfoEl = document.getElementById("all-level-info");
  function updateStatusDisplay() {
    if (eliminatedCountEl) {
      if(isPracticeMode) {
        eliminatedCountEl.textContent = "✗";
      } else {
        eliminatedCountEl.textContent = eliminatedRowsCount;
      }
    }
    if (speedLevelEl) {
      if(isPracticeMode) {
        speedLevelEl.textContent = "✗";
      } else {
        speedLevelEl.textContent = (currentDropInterval / 1000).toString();
      }
    }
    if (nextLevelInfoEl) {
      if(isPracticeMode) {
        nextLevelInfoEl.textContent = `${practiceLevel}`;
      } else {
        nextLevelInfoEl.textContent = `${levelInfo}`;
      }
    }
    if (allLevelInfoEl) {
      if(isPracticeMode) {
        allLevelInfoEl.textContent = `${PRACTICE_LEVELS.length}`;
      } else {
        allLevelInfoEl.textContent = `${LEVEL_INFO.length}`;
      }
    }
  }

  // 根據消除數計算掉落間隔
  function calculateDropInterval(eliminatedCount) {
    for(let i = 0; i < LEVEL_INFO.length; i++) {
      if(eliminatedCount >= LEVEL_INFO[i].eliminatedCount) {
        levelInfo = LEVEL_INFO[i].level;
        return LEVEL_INFO[i].dropInterval;
      }
    }
    levelInfo = 0;
    return GAME_TIME;
  }
  // 更新掉落速度
  function updateDropSpeed() {
    const newInterval = calculateDropInterval(eliminatedRowsCount);
    if (newInterval !== currentDropInterval) {
      const elapsedTime = Date.now() - lastDropTime; // 计算已经过去的时间
      const remainingTime = Math.max(0, currentDropInterval - elapsedTime); // 计算剩余时间

      currentDropInterval = newInterval;
      
      // 重置定时器以应用新的间隔
      if (autoDropTimer) {
        clearInterval(autoDropTimer);
        autoDropTimer = setTimeout(() => {
          if (gameRunning) {
            dropNewRow();
            // 然后设置新的间隔定时器
            autoDropTimer = setInterval(() => {
              if (gameRunning) {
                dropNewRow();
              }
            }, currentDropInterval);
          }
        }, remainingTime);
      }
    }
    
    // 更新状态显示
    updateStatusDisplay();
  }

  // 開始遊戲
  function startGame(isPractice = false) {
    gameRunning = true;
    gameEnding = false;
    eliminatedRowsCount = 0; // 重置消除计数
    currentDropInterval = GAME_TIME; // 重置掉落间隔
    lastDropTime = Date.now(); // 重置掉落时间
    
    // 更新状态显示
    updateStatusDisplay();
    
    // 清空游戏区域
    if (playfield) {
      playfield.innerHTML = '';
      // 移除游戏结束的视觉状态
      playfield.classList.remove('game-ending');
    }

    // 练习模式初始掉落行数
    const initialRows = isPractice ? PRACTICE_LEVELS[practiceLevel - 1].initialRows : 3;
    
    // 开场自动掉落初始行数
    for (let i = 0; i < initialRows; i++) {
      setTimeout(() => dropNewRow(isPractice), 200 * (i + 1));
    }

    // 不使用计时器，因为练习模式不需要自动掉落
    if (!isPractice) {
      autoDropTimer = setInterval(() => {
        if (gameRunning) {
          dropNewRow();
        }
      }, currentDropInterval);
    }
  }

  // 游戏结束函数  
  function gameOver(isPracticeMode = false) {
    
    gameRunning = false;
    
    // 清除定时器
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }

    // 重新获取游戏结束界面元素，确保它存在
    const gameOverScreenElement = document.getElementById("game-over-screen");
    const gameOverTitleElement = document.getElementById("game-over-title");
    const allLevelsClearedTitleElement = document.getElementById("all-levels-cleared-title");
    const finalStatsElement = document.getElementById("final-stats");
    const finalEliminatedCountElement = document.getElementById("final-eliminated-count");

    // 更新最高分数记录
    if (!isPracticeMode) {
      updateMaxScore(eliminatedRowsCount);
    }
    
    // 根據是否為練習模式顯示不同的文案
    if (isPracticeMode) {
      gameOverTitleElement.classList.remove("active");
      allLevelsClearedTitleElement.classList.add("active");
      finalStatsElement.classList.remove("active");
    } else {
      gameOverTitleElement.classList.add("active");
      allLevelsClearedTitleElement.classList.remove("active");
      finalStatsElement.classList.add("active");
      finalEliminatedCountElement.textContent = eliminatedRowsCount;
    }
    
    // 顯示遊戲結束畫面
    gameScreen.classList.remove("active");
    
    if (gameOverScreenElement) {
      gameOverScreenElement.classList.add("active");

      // GSAP 動畫：淡入遊戲結束畫面
      gsap.fromTo(
        gameOverScreenElement,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    } else {
      console.error("gameOverScreen element not found! Trying fallback...");
    }
  }

  // 修改 checkGameOver 函數，傳遞 isPracticeMode
  function checkGameOver() {
    if (!playfield || !gameRunning || gameEnding) return;
    
    const rowCount = playfield.children.length;
    
    if (rowCount >= 10) {
      // 立即設置gameEnding，禁用方格點擊功能
      gameEnding = true;
      // 添加視覺回饋，讓玩家知道遊戲即將結束
      playfield.classList.add('game-ending');
      // 延遲一下結束遊戲，確保玩家能看到當前狀態
      setTimeout(() => gameOver(isPracticeMode), 100);
    }
  }

  // 修改 dropNewRow 函数以支持練習模式
  function dropNewRow(isPractice = false) {
    // 如果游戏未运行，直接返回
    if (!gameRunning) return;

    // 更新最后一次下落的时间
    lastDropTime = Date.now();

    if (!playfield || !gameRunning || gameEnding) return;
    if (playfield.dataset.isEliminating === 'true') return; // 防止動畫期間新增行

    const row = document.createElement("div");
    row.className = "bits-row";

    // 建立 8 個 0 方格直接加入 row 中
    weights.forEach(() => {
      const bit = document.createElement("div");
      bit.className = "bit bit-zero";
      bit.textContent = "0";
      addBitEventListeners(bit); // 用新函數
      row.appendChild(bit);
    });

    // 題目方格
    const qBox = document.createElement("div");
    qBox.className = "bit target-box";
    
    // 根據練習模式的關卡設置最大數字
    const maxNumber = isPractice ? PRACTICE_LEVELS[practiceLevel - 1].maxNumber : 128;
    qBox.textContent = randInt(1, maxNumber);

    row.appendChild(qBox);

    playfield.prepend(row);

    // 掉落動畫：從上方掉落到最上層位置
    gsap.from(row, {
      y: "-100%",
      duration: 0.6,
      ease: "bounce.out",
      onComplete: () => {
        // 动画完成后重新检查游戏是否应该结束
        // 重新计算当前行数，因为在掉落过程中可能有行被消除了
        setTimeout(() => {
          if (!isPractice) {
            checkGameOver();
          }
        }, 100);
      }
    });
  }

  // 修改 checkAndEliminateMatches 函数以支持练习模式的关卡进度
  function checkAndEliminateMatches() {
    if (!playfield || playfield.children.length === 0 || !gameRunning || gameEnding) return;
    if (playfield.dataset.isEliminating === 'true') return;

    const allRows = Array.from(playfield.children);
    const rowsToEliminate = [];

    allRows.forEach(row => {
        const answerBits = row.querySelectorAll(".bit:not(.target-box)");
        const targetBox = row.querySelector(".target-box");

        if (!targetBox || answerBits.length !== weights.length) {
            return;
        }

        const targetNumber = parseInt(targetBox.textContent, 10);
        let currentSum = 0;
        answerBits.forEach((bit, bitIndex) => {
            if (bit.textContent === "1") {
                currentSum += weights[bitIndex];
            }
        });

        if (currentSum === targetNumber) {
            rowsToEliminate.push(row);
        }
    });

    if (rowsToEliminate.length === 0) return;

    playfield.dataset.isEliminating = 'true';

    const rowHeight = allRows[0].getBoundingClientRect().height;
    const rowGap = parseFloat(getComputedStyle(playfield).gap) || 0;
    const fallDistance = rowHeight + rowGap;

    const rowsThatMoved = [];

    const tl = gsap.timeline({
        onComplete: () => {
            // 更新消除计数和答对题目计数
            eliminatedRowsCount += rowsToEliminate.length;
            
            rowsToEliminate.forEach(row => row.remove());
            // 動畫結束後，重設移動過的行的 transform
            if(rowsThatMoved.length > 0) {
              gsap.set(rowsThatMoved, { y: 0, overwrite: true });
            }
            playfield.dataset.isEliminating = 'false';
            
            // 练习模式的关卡进度控制
            if (isPracticeMode) {
              if (eliminatedRowsCount >= PRACTICE_LEVELS[practiceLevel - 1].initialRows) {
                practiceLevel++;
                if (practiceLevel > PRACTICE_LEVELS.length) {
                  // 通关，显示游戏结束画面
                  gameOver(true);
                  // 返回主页
                  isPracticeMode = false;
                  practiceLevel = 1;
                } else {
                  eliminatedRowsCount = 0;
                  startGame(true);
                }
              }
            } else {
              // 更新掉落速度
              updateDropSpeed();
              
              // 消除完毕后检查游戏是否结束
              checkGameOver();
            }
            // 動畫結束後自動再檢查一次，確保連續正確多行都能被依序消除
            setTimeout(checkAndEliminateMatches, 50);
        }
    });

    // 執行消除行的粒子動畫
    rowsToEliminate.forEach(row => {
        scatterBits(row);
        tl.to(row, {
            opacity: 0,
            duration: 0.4,
        }, "<");
    });

    // 計算並執行上方行的掉落動畫
    let eliminatedCount = 0;
    // 從下往上遍歷
    for (let i = allRows.length - 1; i >= 0; i--) {
        const row = allRows[i];
        if (rowsToEliminate.includes(row)) {
            eliminatedCount++;
        } else if (eliminatedCount > 0) {
            // 此行下方有被消除的行，需要向下掉落
            rowsThatMoved.push(row);
            tl.to(row, {
                y: fallDistance * eliminatedCount,
                duration: 0.6,
                ease: 'power2.inOut'
            }, "<"); // 與消除動畫同時開始
        }
    }
  }

  function scatterBits(row) {
    const bitEls = row.querySelectorAll(".bit");
    bitEls.forEach((bitEl) => {
      const rect = bitEl.getBoundingClientRect();
      const char = document.createElement("div");
      char.className = "flying-char";
      char.textContent = bitEl.textContent;
      char.style.position = "absolute";
      char.style.left = `${rect.left + rect.width / 2}px`;
      char.style.top = `${rect.top + rect.height / 2}px`;
      char.style.transform = "translate(-50%, -50%)";
      char.style.fontSize = `${rect.height * 0.5}px`;
      char.style.color = getComputedStyle(bitEl).color;
      char.style.pointerEvents = "none";
      document.body.appendChild(char);

      const velocity = gsap.utils.random(200, 400);
      const angle = gsap.utils.random(-110, -70);

      gsap.to(char, {
        duration: 3,
        rotation: gsap.utils.random(-720, 720),
        physics2D: {
          velocity: velocity,
          angle: angle,
          gravity: 500,
        },
        opacity: 0,
        onComplete: () => char.remove(),
      });

      // 讓原本的方格快速縮小並淡出，營造被炸消失效果
      gsap.to(bitEl, { scale: 0, opacity: 0, duration: 0.3, ease: "back.in(2)" });
    });

  }

  const numbersContainer = document.getElementById("numbers-container");
  // 初始化
  function renderNumbers() {
    numbersContainer.innerHTML = "";
    weights.forEach((n) => {
      const el = document.createElement("div");
      el.className = "number-label";
      el.textContent = n;
      numbersContainer.appendChild(el);
    });

    // 追加 QNS 標籤
    const qnsEl = document.createElement("div");
    qnsEl.className = "number-label";
    qnsEl.textContent = "Q";
    numbersContainer.appendChild(qnsEl);
  }

  // 針對動態加入的新列，簡單切換 0/1
  function simpleToggle(e) {
    // 只有在游戏运行且未结束时才能操作
    if (!gameRunning || gameEnding) return;
    
    const el = e.currentTarget;
    if (el.textContent === "0") {
      el.textContent = "1";
      el.classList.remove("bit-zero");
      el.classList.add("bit-one");
    } else {
      el.textContent = "0";
      el.classList.remove("bit-one");
      el.classList.add("bit-zero");
    }

    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: "power1.out" });

    // 延遲一小段時間再檢查，確保點擊動畫有時間開始
    setTimeout(checkAndEliminateMatches, 100);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 在主函數/初始化區塊組成 gameState 物件
  const gameState = {
    get gameRunning() { return gameRunning; },
    set gameRunning(val) { gameRunning = val; },
    get gameEnding() { return gameEnding; },
    set gameEnding(val) { gameEnding = val; },
    get autoDropTimer() { return autoDropTimer; },
    set autoDropTimer(val) { autoDropTimer = val; },
    pauseMenu,
    isPracticeMode: false, // 會在 startGame 時更新
    get currentDropInterval() { return currentDropInterval; },
    dropNewRow,
    startGame,
    pauseBtn,
    resumeBtn,
    homeBtn,
    restartGameBtn,
    homeScreen,
    gameScreen,
    gsap
  };

  // 初始化暫停選單事件監聽
  setupPauseMenuEvents(gameState);

  // 滑動點擊支援
  let isPointerDown = false;
  let lastToggledBit = null;

  // 只在 bit 上加 pointerdown
  function addBitEventListeners(bit) {
    bit.addEventListener("pointerdown", (e) => {
      isPointerDown = true;
      simpleToggle(e);
      lastToggledBit = e.currentTarget;
    });
  }

  // 在 document 上監聽 pointermove，支援手機滑動觸發多格，排除 .target-box
  // document.addEventListener("pointermove", (e) => {
  //   if (!isPointerDown) return;
  //   let touch = e.touches ? e.touches[0] : e;
  //   let el = document.elementFromPoint(touch.clientX, touch.clientY);
  //   if (
  //     el &&
  //     el.classList &&
  //     el.classList.contains("bit") &&
  //     !el.classList.contains("target-box") // 排除題目格子
  //   ) {
  //     if (el !== lastToggledBit) {
  //       simpleToggle({ currentTarget: el });
  //       lastToggledBit = el;
  //     }
  //   }
  // });
  // document.addEventListener("pointerup", () => {
  //   isPointerDown = false;
  //   lastToggledBit = null;
  // });
  // document.addEventListener("pointercancel", () => {
  //   isPointerDown = false;
  //   lastToggledBit = null;
  // });



  const isAndroid = /android/i.test(navigator.userAgent);
  
  function handleMove(x, y) {
    let el = document.elementFromPoint(x, y);
    if (
      el &&
      el.classList &&
      el.classList.contains("bit") &&
      !el.classList.contains("target-box")
    ) {
      if (el !== lastToggledBit) {
        simpleToggle({ currentTarget: el });
        lastToggledBit = el;
      }
    }
  }
  
  // 找到遊戲區域
  const gameBoard = document.querySelector(".playfield");
  
  // pointer events（電腦 + iOS）
  document.addEventListener("pointerdown", (e) => {
    if (gameBoard.contains(e.target)) {
      isPointerDown = true;
    }
  });
  
  document.addEventListener("pointermove", (e) => {
    if (!isPointerDown || isAndroid) return;
    handleMove(e.clientX, e.clientY);
  });
  
  document.addEventListener("pointerup", () => {
    isPointerDown = false;
    lastToggledBit = null;
  });
  
  document.addEventListener("pointercancel", () => {
    isPointerDown = false;
    lastToggledBit = null;
  });
  
  // Android touch fallback（僅限遊戲區域）
  if (isAndroid && gameBoard) {
    gameBoard.addEventListener("touchstart", (e) => {
      isPointerDown = true;
      e.preventDefault();
    }, { passive: false });
  
    gameBoard.addEventListener("touchmove", (e) => {
      if (!isPointerDown) return;
      e.preventDefault();
      let touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }, { passive: false });
  
    gameBoard.addEventListener("touchend", () => {
      isPointerDown = false;
      lastToggledBit = null;
    });
  
    gameBoard.addEventListener("touchcancel", () => {
      isPointerDown = false;
      lastToggledBit = null;
    });
  }
  
  const infoScreen = document.getElementById('info-screen');
  const infoCloseBtn = document.getElementById('info-close-btn');
  const infoOpenBtns = document.querySelectorAll('.info-open-btn');

  function setLanguage(lang) {
    const langSections = document.querySelectorAll('.info-lang');
    langSections.forEach(sec => {
      sec.classList.toggle('active', sec.classList.contains(`lang-${lang}`));
    });
  }

  if (infoScreen && infoCloseBtn && infoOpenBtns.length) {
    infoOpenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.l;
        setLanguage(lang);
        infoScreen.classList.remove('hidden');
      });
    });

    infoCloseBtn.addEventListener('click', () => {
      infoScreen.classList.add('hidden');
    });
  }

  // 語言切換按鈕
  const langToggleBtn = document.getElementById("lang-toggle-btn");
  const languageOrder = ['ja', 'zh', 'en'];
  let currentLanguageIndex = 0;

  function getInitialLanguage() {
    // 獲取瀏覽器語言
    const browserLang = (navigator.language || navigator.userLanguage).toLowerCase();
    // 根據語言代碼判斷
    if (browserLang.startsWith('zh')) {
      return 'zh';
    } else if (browserLang.startsWith('ja')) {
      return 'ja';
    } else {
      return 'en';
    }
  }

  function updatePageLanguage(lang, translationsFile) {
    // 更新遊戲說明按鈕的語言
    const infoBtns = document.querySelectorAll('.info-open-btn');
    infoBtns.forEach(btn => {
      // 隱藏所有按鈕
      btn.style.display = 'none';
      // 只顯示當前語言的按鈕
      if (btn.dataset.l === lang) {
        btn.style.display = 'inline-block';
      }
    });

    // 更新遊戲標題
    const titleSpans = document.querySelectorAll('.game-title span[lang]');
    titleSpans.forEach(span => {
      span.classList.toggle('active', span.lang === lang);
    });

    if (translationsFile && translationsFile.translations) {
      document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        const text = translationsFile.translations[key]?.[lang] 
                  || translationsFile.translations[key]?.['en'];
        if (text) el.textContent = text;
      });
    }

    if(document.querySelector('.header-nav-lang')) {
      const jpBtn = document.querySelector('.header-nav-lang-jp');
      const enBtn = document.querySelector('.header-nav-lang-en');
      const zhBtn = document.querySelector('.header-nav-lang-zh');
    
      if(lang === 'ja') {
        jpBtn.classList.add('active');
        enBtn.classList.remove('active');
        zhBtn.classList.remove('active');
      } else if(lang === 'en') {
        jpBtn.classList.remove('active');
        enBtn.classList.add('active');
        zhBtn.classList.remove('active');
      } else if(lang === 'zh') {
        jpBtn.classList.remove('active');
        enBtn.classList.remove('active');
        zhBtn.classList.add('active');
      }
    }
    // 更新當前語言索引
    currentLanguageIndex = languageOrder.indexOf(lang);
  }

  if(document.querySelector('.header-nav-lang')){
    const jpBtn = document.querySelector('.header-nav-lang-jp');
    const enBtn = document.querySelector('.header-nav-lang-en');
    const zhBtn = document.querySelector('.header-nav-lang-zh');

    jpBtn?.addEventListener('click', () => {
      updatePageLanguage('ja', translationsFile);
    });
    enBtn?.addEventListener('click', () => {
      updatePageLanguage('en', translationsFile);
    });
    zhBtn?.addEventListener('click', () => {
      updatePageLanguage('zh', translationsFile);
    });
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      currentLanguageIndex = (currentLanguageIndex + 1) % languageOrder.length;
      const newLang = languageOrder[currentLanguageIndex];
      updatePageLanguage(newLang, translationsFile);
    });
  }

  // 初始化時設置語言
  const initialLang = getInitialLanguage();
  updatePageLanguage(initialLang, translationsFile);


  // 在 DOMContentLoaded 時載入翻譯
  document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    // 初始化語言
    const initialLang = getInitialLanguage();
    updatePageLanguage(initialLang, translationsFile);
    renderNumbers();
  });
})(); 