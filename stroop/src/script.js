import { updatePageLanguage, getInitialLanguage } from './game-lang.js';
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

  // Register plugin if not yet
  if (Physics2DPlugin) {
    gsap.registerPlugin(Physics2DPlugin);
  }

  // 開始遊戲按鈕
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");

    // 开始游戏
    startGame();

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

  // 開始遊戲
  function startGame() {
    // 清空游戏区域
    if (playfield) {
      playfield.innerHTML = '';
      // 移除游戏结束的视觉状态
      playfield.classList.remove('game-ending');
    }
  }

  // 在 DOMContentLoaded 時載入翻譯
  document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    // 初始化語言
    const initialLang = getInitialLanguage();
    updatePageLanguage(initialLang, translationsFile);
  });
})(); 