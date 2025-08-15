let translationsFile = null;

// 異步載入翻譯
async function loadTranslations() {
  try {
    const response = await fetch(
      ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? './public/config/translations.json'
        : './config/translations.json'
    );

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('回應不是有效的 JSON');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    translationsFile = await response.json();
    return translationsFile;
  } catch (error) {
    console.error('載入翻譯失敗:', error);
    return null;
  }
}

// Stroop遊戲
(() => {
  // 遊戲元素
  const homeScreen = document.getElementById("home-screen");
  const gameScreen = document.getElementById("game-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-button");
  const colorWord = document.getElementById("color-word");
  const colorButtons = document.querySelectorAll(".color-btn");
  const timerEl = document.getElementById("timer");
  const scoreEl = document.getElementById("score");
  const finalScoreEl = document.getElementById("final-score");
  const maxScoreEl = document.getElementById("max-score");
  const answerDisplay = document.getElementById("answer-display");

  // 暫停相關元素
  const pauseBtn = document.getElementById("pause-btn");
  const pauseMenu = document.getElementById("pause-menu");
  const resumeBtn = document.getElementById("resume-btn");
  const homeBtn = document.getElementById("home-btn");
  const restartGameBtn = document.getElementById("restart-game-btn");

  // 遊戲狀態
  let gameRunning = false;
  let timeLeft = 30;
  let score = 0;
  let timer;
  let maxScore = localStorage.getItem('stroopMaxScore') || 0;
  let pausedTimeLeft = 0;
  let currentColors;

  const rootStyle = getComputedStyle(document.documentElement);

  const colors = {
    coffee: rootStyle.getPropertyValue('--coffee').trim(),
    purple: rootStyle.getPropertyValue('--purple').trim(),
    blue: rootStyle.getPropertyValue('--blue').trim(),
    red: rootStyle.getPropertyValue('--red').trim(),
    orange: rootStyle.getPropertyValue('--orange').trim(),
    green: rootStyle.getPropertyValue('--green').trim(),
  };

  // 新增：隨機化按鈕顏色
  function randomizeButtonColors() {
    const colorNames = Object.keys(colors);

    // Fisher-Yates shuffle
    for (let i = colorNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorNames[i], colorNames[j]] = [colorNames[j], colorNames[i]];
    }

    colorButtons.forEach((button, index) => {
      const colorName = colorNames[index];
      button.dataset.color = colorName;
      button.style.backgroundColor = colors[colorName];
    });
  }

  // 暫停遊戲
  function pauseGame() {
    if (!gameRunning) return;

    gameRunning = false;
    pausedTimeLeft = timeLeft;
    clearInterval(timer);

    pauseMenu.classList.add('active');
  }

  // 繼續遊戲
  function resumeGame() {
    gameRunning = true;
    timeLeft = pausedTimeLeft;
    timerEl.textContent = timeLeft;

    pauseMenu.classList.remove('active');

    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  // 更新按鈕文字
  function updateButtonTexts(translations) {
    colorButtons.forEach(button => {
      const color = button.getAttribute('data-color');
      button.textContent = translations.translations[color]?.[currentLanguage];
    });
  }

  // 生成隨機顏色和文字
  function generateColorWord(dict) {
    const arrColor = ['coffee', 'purple', 'blue', 'red', 'orange', 'green'];
    const randomIndex = Math.floor(Math.random() * arrColor.length);

    const chosenColor = arrColor[randomIndex];
    const translation = dict.translations[chosenColor]?.[currentLanguage];

    // 字
    colorWord.textContent = translation;
    // 顏色
    let wordColorName, bgColorName;
    do {
      wordColorName = arrColor[Math.floor(Math.random() * arrColor.length)];
      bgColorName = arrColor[Math.floor(Math.random() * arrColor.length)];
    } while (wordColorName === bgColorName);

    colorWord.style.color = colors[wordColorName];
    //colorWord.style.backgroundColor = colors[bgColorName];


    // 更新答案顯示
    if (answerDisplay) {
      answerDisplay.textContent = `答案: ${translation}`;
    }

    return translation;
  }

  // 更新最高分
  function updateMaxScore() {
    if (score > maxScore) {
      maxScore = score;
      localStorage.setItem('stroopMaxScore', maxScore);
      maxScoreEl.textContent = maxScore;
    }
  }

  // 檢查答案是否正確
  function checkAnswer(selectedColor, currentColors) {
    return selectedColor === currentColors;
  }

  function setupButtonListeners(translations) {
    colorButtons.forEach(button => {
      button.addEventListener('click', function () {
        if (!gameRunning) return;

        const selectedColor = this.textContent;

        if (checkAnswer(selectedColor, currentColors)) {
          score += 5;
          scoreEl.textContent = score;

          currentColors = generateColorWord(translations);
        } else {
          score = Math.max(0, score - 10);
          scoreEl.textContent = score;
        }
      });
    });
  }

  // 開始遊戲
  function startGame(translations) {
    gameRunning = true;
    timeLeft = 30;
    score = 0;

    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;

    randomizeButtonColors();
    updateButtonTexts(translations);

    currentColors = generateColorWord(translations);

    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  // 結束遊戲
  function endGame() {
    gameRunning = false;
    clearInterval(timer);

    updateMaxScore();
    finalScoreEl.textContent = score;

    gameScreen.classList.remove("active");
    gameOverScreen.classList.add("active");
  }

  // // 暫停按鈕事件監聽器
  pauseBtn.addEventListener('click', pauseGame);
  resumeBtn.addEventListener('click', resumeGame);
  homeBtn.addEventListener('click', () => {
    gameRunning = false;
    clearInterval(timer);
    pauseMenu.classList.remove('active');
    homeScreen.classList.add('active');
    gameScreen.classList.remove('active');
  });
  restartGameBtn.addEventListener('click', () => {
    pauseMenu.classList.remove('active');
    startGame(translationsFile);
  });

  // 事件監聽器
  startBtn.addEventListener("click", () => {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");
    startGame(translationsFile);
  });

  restartBtn.addEventListener("click", () => {
    gameOverScreen.classList.remove("active");
    homeScreen.classList.add("active");
  });

  // 初始化最高分
  maxScoreEl.textContent = maxScore;

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
  let currentLanguage = 'zh';

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

    if (document.querySelector('.header-nav-lang')) {
      const jpBtn = document.querySelector('.header-nav-lang-jp');
      const enBtn = document.querySelector('.header-nav-lang-en');
      const zhBtn = document.querySelector('.header-nav-lang-zh');

      if (lang === 'ja') {
        jpBtn.classList.add('active');
        enBtn.classList.remove('active');
        zhBtn.classList.remove('active');
      } else if (lang === 'en') {
        jpBtn.classList.remove('active');
        enBtn.classList.add('active');
        zhBtn.classList.remove('active');
      } else if (lang === 'zh') {
        jpBtn.classList.remove('active');
        enBtn.classList.remove('active');
        zhBtn.classList.add('active');
      }
    }
    currentLanguage = lang;
  }

  if (document.querySelector('.header-nav-lang')) {
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

  // 初始化時設置語言
  const initialLang = getInitialLanguage();
  updatePageLanguage(initialLang, translationsFile);


  // 在 DOMContentLoaded 時載入翻譯
  document.addEventListener('DOMContentLoaded', async () => {
    const translations = await loadTranslations();

    // 初始化語言
    currentLanguage = getInitialLanguage();
    updatePageLanguage(currentLanguage, translations);

    // 更新按鈕文字
    if (translations) {
      updateButtonTexts(translations);
      setupButtonListeners(translations);
    }
  });
})(); 