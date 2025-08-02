// 移除原有的 import
// 改為全局變量
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
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-button");
  const numbersContainer = document.getElementById("numbers-container");
  const playfield = document.querySelector('.playfield');
  const eliminatedCountEl = document.getElementById("eliminated-count");
  const speedLevelEl = document.getElementById("speed-level");
  const nextLevelInfoEl = document.getElementById("next-level-info");
  const practiceBtn = document.getElementById("practice-button");
  const maxScoreEl = document.getElementById("max-score");

  // 新增最高分数记录
  let maxEliminatedRowsCount = localStorage.getItem('maxEliminatedRowsCount') || 0;
  maxScoreEl.textContent = maxEliminatedRowsCount;

  // 更新最高分数记录的函数
  function updateMaxScore(currentScore) {
    if (currentScore > maxEliminatedRowsCount) {
      maxEliminatedRowsCount = currentScore;
      localStorage.setItem('maxEliminatedRowsCount', currentScore);
      maxScoreEl.textContent = currentScore;
    }
  }

  // 新增暫停選單相關元素
  const pauseBtn = document.getElementById("pause-btn");
  const pauseMenu = document.getElementById("pause-menu");
  const resumeBtn = document.getElementById("resume-btn");
  const homeBtn = document.getElementById("home-btn");
  const restartGameBtn = document.getElementById("restart-game-btn");

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

  // 游戏状态管理
  let gameRunning = false;
  let gameEnding = false;
  let autoDropTimer = null;
  let eliminatedRowsCount = 0; // 成功消除的行数统计
  let currentDropInterval = GAME_TIME; // 当前掉落间隔（毫秒）

  // Register plugin if not yet
  if (window.Physics2DPlugin) {
    gsap.registerPlugin(window.Physics2DPlugin);
  }

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

  // ---- 遊戲說明 ----
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

  // 修改 updatePageLanguage 函數以支持異步載入
  function updatePageLanguage(lang) {
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
      updatePageLanguage('ja');
      jpBtn.classList.add('active');
      enBtn.classList.remove('active');
      zhBtn.classList.remove('active');
    });
    enBtn?.addEventListener('click', () => {
      updatePageLanguage('en');
      jpBtn.classList.remove('active');
      enBtn.classList.add('active');
      zhBtn.classList.remove('active');
    });
    zhBtn?.addEventListener('click', () => {
      updatePageLanguage('zh');
      jpBtn.classList.remove('active');
      enBtn.classList.remove('active');
      zhBtn.classList.add('active');
    });
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      currentLanguageIndex = (currentLanguageIndex + 1) % languageOrder.length;
      const newLang = languageOrder[currentLanguageIndex];
      updatePageLanguage(newLang);
    });
  }

  // 初始化時設置語言
  const initialLang = getInitialLanguage();
  updatePageLanguage(initialLang);

  // 根据消除数计算掉落间隔
  function calculateDropInterval(eliminatedCount) {
    // if (eliminatedCount >= 10) return 1000;  // 1秒
    if (eliminatedCount >= 7) return 2000;   // 2秒
    if (eliminatedCount >= 5) return 3000;   // 3秒
    if (eliminatedCount >= 3) return 4000;   // 4秒
    return GAME_TIME; // 默认5秒
  }

  // 获取下一级信息
  function getNextLevelInfo(currentCount) {
    // if (currentCount >= 10) {
    //   return "Level: Max";
    // } else 
    if (currentCount >= 7) {
      return `Lv.Max`;
    } else if (currentCount >= 5) {
      return `Lv.3`;
    } else if (currentCount >= 3) {
      return `Lv.2`;
    } else {
      return `Lv.1`;
    }
  }

  // 更新状态显示
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
        nextLevelInfoEl.textContent = `Lv.${practiceLevel}`;
      } else {
        nextLevelInfoEl.textContent = getNextLevelInfo(eliminatedRowsCount);
      }
    }
  }

  // 更新掉落速度
  function updateDropSpeed() {
    const newInterval = calculateDropInterval(eliminatedRowsCount);
    if (newInterval !== currentDropInterval) {
      currentDropInterval = newInterval;
      
      // 重置定时器以应用新的间隔
      if (autoDropTimer) {
        clearInterval(autoDropTimer);
        autoDropTimer = setInterval(() => {
          if (gameRunning) {
            dropNewRow();
            // 游戏结束检查现在由 dropNewRow() 处理
          }
        }, currentDropInterval);
      }
      
    }
    
    // 更新状态显示
    updateStatusDisplay();
  }

  // 修改 startGame 函数以支持练习模式
  function startGame(isPractice = false) {
    gameRunning = true;
    gameEnding = false;
    eliminatedRowsCount = 0; // 重置消除计数
    currentDropInterval = GAME_TIME; // 重置掉落间隔
    
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
      setTimeout(() => gameOver(isPracticeMode, practiceLevel), 100);
    }
  }

  // 修改 dropNewRow 函數以支持練習模式
  function dropNewRow(isPractice = false) {
    if (!playfield || !gameRunning || gameEnding) return;
    if (playfield.dataset.isEliminating === 'true') return; // 防止動畫期間新增行

    const row = document.createElement("div");
    row.className = "bits-row";

    // 建立 8 個 0 方格直接加入 row 中
    weights.forEach(() => {
      const bit = document.createElement("div");
      bit.className = "bit bit-zero";
      bit.textContent = "0";
      bit.addEventListener("click", simpleToggle);
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
            gsap.set(rowsThatMoved, { y: 0, overwrite: true });
            playfield.dataset.isEliminating = 'false';
            
            // 练习模式的关卡进度控制
            if (isPracticeMode) {
              if (eliminatedRowsCount >= PRACTICE_LEVELS[practiceLevel - 1].initialRows) {
                practiceLevel++;
                if (practiceLevel > PRACTICE_LEVELS.length) {
                  // 通关，显示游戏结束画面
                  gameOver(true, practiceLevel);
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
        }
    });

    // 執行消除行的粒子動畫
    rowsToEliminate.forEach(row => {
        scatterBits(row, row.querySelector('.target-box'));
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

  function scatterBits(row, targetEl) {
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

    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      const tChar = document.createElement("div");
      tChar.className = "flying-char";
      tChar.textContent = targetEl.textContent;
      Object.assign(tChar.style, {
        position: "absolute",
        left: `${tRect.left + tRect.width / 2}px`,
        top: `${tRect.top + tRect.height / 2}px`,
        transform: "translate(-50%, -50%)",
        fontSize: `${tRect.height * 0.5}px`,
        color: getComputedStyle(targetEl).color,
        pointerEvents: "none",
      });
      document.body.appendChild(tChar);

      const velT = gsap.utils.random(200, 400);
      const angT = gsap.utils.random(-110, -70);

      gsap.to(tChar, {
        duration: 3,
        rotation: gsap.utils.random(-720, 720),
        physics2D: {
          velocity: velT,
          angle: angT,
          gravity: 500,
        },
        opacity: 0,
        onComplete: () => tChar.remove(),
      });

      // 目標方格自身縮小消失
      gsap.to(targetEl, { scale: 0, opacity: 0, duration: 0.3, ease: "back.in(2)" });
    }
  }

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
    qnsEl.textContent = "QNS";
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

  // 暫停遊戲函數
  function pauseGame() {
    if (!gameRunning || gameEnding) return;
    
    gameRunning = false;
    
    // 清除自動掉落定時器
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }
    
    // 顯示暫停選單
    pauseMenu.classList.add("active");
    
    // GSAP 動畫：淡入暫停選單
    gsap.fromTo(
      pauseMenu,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }

  // 繼續遊戲函數
  function resumeGame() {
    gameRunning = true;
    
    // 重新設置自動掉落定時器
    if (!isPracticeMode) {
      autoDropTimer = setInterval(() => {
        if (gameRunning) {
          dropNewRow();
        }
      }, currentDropInterval);
    }
    
    // 隱藏暫停選單
    pauseMenu.classList.remove("active");
  }

  // 事件監聽器
  pauseBtn.addEventListener("click", pauseGame);
  
  resumeBtn.addEventListener("click", () => {
    resumeGame();
  });
  
  homeBtn.addEventListener("click", () => {
    // 停止遊戲並重置狀態
    gameRunning = false;
    gameEnding = false;
    
    // 清除定時器
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }
    
    // 隱藏暫停選單
    pauseMenu.classList.remove("active");
    
    // 返回首頁
    homeScreen.classList.add("active");
    gameScreen.classList.remove("active");
    
    // GSAP 動畫：逐漸淡入首頁畫面
    gsap.fromTo(
      homeScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  });
  
  restartGameBtn.addEventListener("click", () => {
    // 隱藏暫停選單
    pauseMenu.classList.remove("active");
    
    // 重新開始遊戲
    startGame(isPracticeMode);
  });

  // 在 DOMContentLoaded 時載入翻譯
  document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    // 初始化語言
    const initialLang = getInitialLanguage();
    updatePageLanguage(initialLang);
    renderNumbers();
  });
})(); 